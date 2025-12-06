import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

// Puppeteer removed - using cheerio only for better Vercel compatibility

export async function scrapeProductData(url: string) {
  try {
    if (!url || typeof url !== "string") {
      throw new Error("URL is required");
    }

    // Fetch the page with better headers
    const isAmazon = url.includes("amazon.com") || url.includes("amzn.to");
    const isShopify = url.includes("myshopify.com") || 
                      url.includes("shopify.com") ||
                      url.includes("thearcanelibrary.com") ||
                      url.includes("fangamer.com") ||
                      (url.includes("collections/") && url.includes("/products/"));
    
    // Using cheerio for all scraping (including Amazon) for better Vercel compatibility
    
    // Regular scraping with cheerio for non-Amazon or as fallback
    const headers: HeadersInit = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Connection": "keep-alive",
      "Upgrade-Insecure-Requests": "1",
    };
    
    if (isAmazon) {
      headers["Referer"] = "https://www.amazon.com/";
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    
    // Check if we got a valid HTML response
    if (!html || html.length < 100) {
      throw new Error("Received empty or invalid HTML response");
    }
    
    // Check if Amazon is blocking us (common patterns)
    if (isAmazon && (html.includes("Robot Check") || html.includes("captcha") || html.includes("Sorry! We couldn't find that page"))) {
      console.warn("Amazon may be blocking the scraper or page not found");
      // Return minimal data rather than failing completely
      return {
        title: "Amazon Product",
        image: "",
        description: "Product from Amazon (scraping blocked)",
        price: "",
        url,
      };
    }
    
    const $ = cheerio.load(html);

    // Extract metadata first (needed for fallbacks)
    // For Amazon, try more specific selectors
    let title = "";
    if (isAmazon) {
      // Amazon-specific title selectors
      title = 
        $('#productTitle').text()?.trim() ||
        $('h1.a-size-large').text()?.trim() ||
        $('h1.a-size-base-plus').text()?.trim() ||
        $('span#productTitle').text()?.trim() ||
        $('h1').first().text()?.trim() ||
        "";
      
      // Clean up Amazon title (remove extra whitespace, "Amazon.com" suffix)
      if (title) {
        title = title.replace(/\s+/g, ' ').trim();
        title = title.replace(/\s*-\s*Amazon\.com.*$/i, '').trim();
        title = title.replace(/\s*Amazon\.com.*$/i, '').trim();
      }
    }
    
    // Fallback to meta tags if Amazon-specific selectors didn't work
    if (!title) {
      title =
        $('meta[property="og:title"]').attr("content")?.trim() ||
        $('meta[name="twitter:title"]').attr("content")?.trim() ||
        $("title").text()?.trim() ||
        $('h1').first().text()?.trim() ||
        "";
      
      // Clean up title from meta tags too
      if (title && isAmazon) {
        title = title.replace(/\s*-\s*Amazon\.com.*$/i, '').trim();
        title = title.replace(/\s*Amazon\.com.*$/i, '').trim();
      }
    }

    let image = "";
    if (isAmazon) {
      // Amazon-specific image selectors
      image = 
        $('#landingImage').attr('src') ||
        $('#landingImage').attr('data-old-src') ||
        $('#landingImage').attr('data-a-dynamic-image') ||
        $('img[data-a-dynamic-image]').first().attr('data-a-dynamic-image') ||
        $('img#landingImage').attr('src') ||
        "";
      
      // Parse data-a-dynamic-image JSON if needed
      if (!image) {
        const dynamicImage = $('img[data-a-dynamic-image]').first().attr('data-a-dynamic-image');
        if (dynamicImage) {
          try {
            const imageObj = JSON.parse(dynamicImage);
            const imageKeys = Object.keys(imageObj);
            if (imageKeys.length > 0) {
              image = imageKeys[0];
            }
          } catch (e) {
            // Ignore
          }
        }
      }
    }
    
    // Fallback to meta tags
    if (!image) {
      image =
        $('meta[property="og:image"]').attr("content") ||
        $('meta[name="twitter:image"]').attr("content") ||
        $('meta[property="og:image:url"]').attr("content") ||
        "";
    }

    let description = "";
    if (isAmazon) {
      // Amazon-specific description selectors
      description =
        $('#productDescription').text()?.trim() ||
        $('#feature-bullets').text()?.trim() ||
        $('.product-description').text()?.trim() ||
        "";
    }
    
    // Fallback to meta tags
    if (!description) {
      description =
        $('meta[property="og:description"]').attr("content") ||
        $('meta[name="twitter:description"]').attr("content") ||
        $('meta[name="description"]').attr("content") ||
        "";
    }

    // Shopify-specific extraction (Fangamer, etc.)
    if (isShopify) {
      console.log("Detected Shopify store, extracting product data...");
      
      let shopifyTitle = "";
      let shopifyPrice = "";
      let shopifyImage = "";
      let shopifyDescription = "";
      let shopifySize = "";
      
      // Try to extract from JSON-LD structured data (most reliable for Shopify)
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const jsonText = $(el).html() || "{}";
          const json = JSON.parse(jsonText);
          
          // Handle array of JSON-LD objects
          const productData = Array.isArray(json) 
            ? json.find((item: any) => item['@type'] === 'Product')
            : json['@type'] === 'Product' ? json : null;
          
          if (productData) {
            if (!shopifyTitle && productData.name) shopifyTitle = productData.name;
            if (!shopifyImage && productData.image) {
              shopifyImage = Array.isArray(productData.image) 
                ? productData.image[0] 
                : typeof productData.image === 'string'
                ? productData.image
                : productData.image?.url || productData.image;
            }
            if (!shopifyDescription && productData.description) {
              shopifyDescription = productData.description;
            }
            if (!shopifyPrice && productData.offers) {
              const offer = Array.isArray(productData.offers) 
                ? productData.offers[0] 
                : productData.offers;
              if (offer?.price) {
                const currency = offer.priceCurrency || 'USD';
                const priceValue = typeof offer.price === 'string' 
                  ? offer.price 
                  : offer.price.toString();
                shopifyPrice = `$${priceValue}`;
              }
            }
          }
        } catch (e) {
          // Ignore parse errors
        }
      });
      
      // Also try to extract from Shopify's product JSON object (often in script tags)
      $('script').each((_, el) => {
        try {
          const scriptText = $(el).html() || "";
          // Look for Shopify product JSON patterns
          if (scriptText.includes('product') || scriptText.includes('Product') || scriptText.includes('variant')) {
            // Try to find JSON objects with product data
            const jsonMatches = scriptText.match(/\{[\s\S]*?"product"[\s\S]*?\}/g) || 
                               scriptText.match(/\{[\s\S]*?"Product"[\s\S]*?\}/g) ||
                               scriptText.match(/\{[\s\S]*?"title"[\s\S]*?"price"[\s\S]*?\}/g);
            
            for (const match of jsonMatches || []) {
              try {
                const productJson = JSON.parse(match);
                if (productJson.title && !shopifyTitle) {
                  shopifyTitle = productJson.title;
                }
                if (productJson.price && !shopifyPrice) {
                  const priceNum = typeof productJson.price === 'number' 
                    ? productJson.price / 100 // Shopify prices are often in cents
                    : parseFloat(productJson.price);
                  if (!isNaN(priceNum)) {
                    shopifyPrice = `$${priceNum.toFixed(2)}`;
                  }
                }
                if (productJson.images && productJson.images[0] && !shopifyImage) {
                  shopifyImage = productJson.images[0];
                }
              } catch (e) {
                // Not valid JSON, continue
              }
            }
          }
        } catch (e) {
          // Ignore
        }
      });
      
      // Try Shopify-specific HTML selectors
      if (!shopifyTitle) {
        shopifyTitle = 
          $('.product-title, .product__title, h1.product-title, h1.product__title').first().text().trim() ||
          $('h1').first().text().trim() ||
          $('h1.product-single__title').text().trim() ||
          $('.product-single__title').text().trim() ||
          "";
      }
      
      if (!shopifyPrice) {
        // Try various Shopify price selectors
        const priceSelectors = [
          '.product-price, .product__price',
          '.price, .product-price__current',
          '[data-product-price]',
          '.money',
          '.price-current, .price__current',
          '.product-single__price',
          '.product-price-wrapper',
          'span[itemprop="price"]',
        ];
        
        for (const selector of priceSelectors) {
          const priceEl = $(selector).first();
          if (priceEl.length) {
            const priceText = priceEl.text().trim() || priceEl.attr('data-product-price') || priceEl.attr('content') || priceEl.attr('itemprop') === 'price' ? priceEl.text().trim() : '';
            if (priceText) {
              // Look for price pattern in the text
              const priceMatch = priceText.match(/\$?([\d,]+\.?\d{0,2})/);
              if (priceMatch) {
                shopifyPrice = `$${priceMatch[1]}`;
                break;
              }
            }
          }
        }
        
        // If still no price, try searching the entire page for price patterns near "price" text
        if (!shopifyPrice) {
          const pricePattern = /\$(\d+(?:\.\d{2})?)/;
          const bodyText = $('body').text();
          const match = bodyText.match(pricePattern);
          if (match) {
            shopifyPrice = `$${match[1]}`;
          }
        }
      }
      
      if (!shopifyImage) {
        // Try Shopify image selectors
        shopifyImage = 
          $('.product-image img, .product__image img, .product-photos img').first().attr('src') ||
          $('img[data-product-image]').first().attr('src') ||
          $('.product-gallery img').first().attr('src') ||
          $('.product-single__photo img').first().attr('src') ||
          $('.product__media img').first().attr('src') ||
          $('img[data-src]').first().attr('data-src') ||
          "";
        
        // Handle relative URLs and data-src attributes
        if (shopifyImage && shopifyImage.startsWith('//')) {
          shopifyImage = 'https:' + shopifyImage;
        } else if (shopifyImage && shopifyImage.startsWith('/')) {
          try {
            const urlObj = new URL(url);
            shopifyImage = urlObj.origin + shopifyImage;
          } catch (e) {
            // Ignore
          }
        }
        
        // If still no image, try to get from meta tags (already set above, but check again)
        if (!shopifyImage) {
          shopifyImage = image || "";
        }
      }
      
      if (!shopifyDescription) {
        shopifyDescription = 
          $('.product-description, .product__description, .product-content').first().text().trim() ||
          $('[data-product-description]').first().text().trim() ||
          $('.product-single__description').text().trim() ||
          $('.product__description').text().trim() ||
          "";
      }
      
      // Try to detect size options for clothing
      const sizeSelectors = [
        'select[name*="size"] option:selected',
        'input[name*="size"]:checked',
        '.product-option input[type="radio"]:checked',
        '[data-option-name*="size"] input:checked',
        '.variant-selector input:checked',
      ];
      
      for (const selector of sizeSelectors) {
        const sizeEl = $(selector).first();
        if (sizeEl.length) {
          const sizeText = sizeEl.attr('value') || sizeEl.text().trim() || sizeEl.attr('data-value');
          if (sizeText && sizeText !== 'Select' && sizeText !== 'Choose') {
            shopifySize = sizeText;
            break;
          }
        }
      }
      
      // If we got Shopify data, use it
      if (shopifyTitle || shopifyPrice || shopifyImage) {
        return {
          title: shopifyTitle || title.trim() || "Product",
          image: shopifyImage || image || "",
          description: shopifyDescription || description.trim() || "",
          price: shopifyPrice || "",
          size: shopifySize || "",
          url,
        };
      }
    }

    // Amazon-specific extraction (Amazon pages are heavily JavaScript-rendered, but we can try)
    if (isAmazon) {
      // First, try to extract from JSON-LD or inline JSON data (most reliable)
      let amazonTitle = "";
      let amazonPrice = "";
      let amazonImage = "";
      let amazonDescription = "";
      
      // Try to find product data in JSON-LD or script tags
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const jsonText = $(el).html() || "{}";
          const json = JSON.parse(jsonText);
          
          if (Array.isArray(json)) {
            const product = json.find((item: any) => item['@type'] === 'Product');
            if (product) {
              if (!amazonTitle && product.name) amazonTitle = product.name;
              if (!amazonImage && product.image) {
                amazonImage = Array.isArray(product.image) ? product.image[0] : product.image;
              }
              if (!amazonDescription && product.description) amazonDescription = product.description;
              if (!amazonPrice && product.offers) {
                const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
                if (offer?.price) {
                  amazonPrice = `$${offer.price}`;
                  if (offer.priceCurrency) {
                    // Already formatted
                  }
                }
              }
            }
          } else if (json['@type'] === 'Product') {
            if (!amazonTitle && json.name) amazonTitle = json.name;
            if (!amazonImage && json.image) {
              amazonImage = Array.isArray(json.image) ? json.image[0] : json.image;
            }
            if (!amazonDescription && json.description) amazonDescription = json.description;
            if (!amazonPrice && json.offers) {
              const offer = Array.isArray(json.offers) ? json.offers[0] : json.offers;
              if (offer?.price) {
                amazonPrice = `$${offer.price}`;
              }
            }
          }
        } catch (e) {
          // Ignore parse errors
        }
      });
      
      // Try to extract from window.ue_* or other inline data
      const scriptTags = $('script').toArray();
      for (const script of scriptTags) {
        const scriptText = $(script).html() || "";
        if (scriptText.includes('data["images"]') || scriptText.includes('ue_')) {
          try {
            // Try to extract title
            const titleMatch = scriptText.match(/data\["title"\]\s*=\s*["']([^"']+)["']/);
            if (titleMatch && !amazonTitle) amazonTitle = titleMatch[1];
            
            // Try to extract price
            const priceMatch = scriptText.match(/data\["price"\]\s*=\s*["']([^"']+)["']/);
            if (priceMatch && !amazonPrice) amazonPrice = priceMatch[1];
          } catch (e) {
            // Ignore
          }
        }
      }
      
      // Try Amazon-specific selectors (fallback)
      if (!amazonTitle) {
        amazonTitle = 
          $('#productTitle').text().trim() ||
          $('h1.a-size-large').text().trim() ||
          $('span#productTitle').text().trim() ||
          $('h1[data-automation-id="title"]').text().trim() ||
          $('h1.a-size-base-plus').text().trim() ||
          "";
      }
      
      // Amazon price extraction - get the main displayed price (not per-count)
      // If we didn't get price from JSON-LD, try HTML selectors
      let discountPercent = "";
      
      // Strategy: Look specifically in price blocks, avoid per-count prices
      // The main price is usually in #priceblock_dealprice or #priceblock_ourprice
      
      // If we didn't get price from JSON-LD, try HTML selectors
      if (!amazonPrice) {
        // First, try deal price block (most reliable for sale items)
      const dealPriceBlock = $('#priceblock_dealprice');
      if (dealPriceBlock.length) {
        const dealPriceEl = dealPriceBlock.find('.a-offscreen').first();
        if (dealPriceEl.length) {
          const priceText = dealPriceEl.text().trim();
          const priceMatch = priceText.match(/[\d,]+\.?\d*/);
          if (priceMatch) {
            const priceValue = parseFloat(priceMatch[0].replace(/,/g, ''));
            // Check if this block contains per-count text
            const blockText = dealPriceBlock.text();
            const hasPerCount = blockText.includes('/count') || blockText.includes('per count');
            
            // If no per-count indicator, or price is reasonable, use it
            if (!hasPerCount || priceValue >= 20) {
              amazonPrice = `$${priceMatch[0]}`;
            }
          }
        }
      }
      
      // If no deal price, try regular price block
      if (!amazonPrice) {
        const ourPriceBlock = $('#priceblock_ourprice');
        if (ourPriceBlock.length) {
          const ourPriceEl = ourPriceBlock.find('.a-offscreen').first();
          if (ourPriceEl.length) {
            const priceText = ourPriceEl.text().trim();
            const priceMatch = priceText.match(/[\d,]+\.?\d*/);
            if (priceMatch) {
              const priceValue = parseFloat(priceMatch[0].replace(/,/g, ''));
              const blockText = ourPriceBlock.text();
              const hasPerCount = blockText.includes('/count') || blockText.includes('per count');
              
              if (!hasPerCount || priceValue >= 20) {
                amazonPrice = `$${priceMatch[0]}`;
              }
            }
          }
        }
      }
      
      // Fallback: Look for price in main price area, but filter out per-count
      if (!amazonPrice) {
        const priceBlock = $('#price');
        if (priceBlock.length) {
          const blockText = priceBlock.text();
          const hasPerCount = blockText.includes('/count') || blockText.includes('per count');
          
          // Get all prices from this block
          const allPrices: Array<{ price: string; value: number }> = [];
          priceBlock.find('.a-offscreen').each((_, el) => {
            const priceText = $(el).text().trim();
            const priceMatch = priceText.match(/[\d,]+\.?\d*/);
            if (priceMatch) {
              const priceValue = parseFloat(priceMatch[0].replace(/,/g, ''));
              if (priceValue >= 10) {
                allPrices.push({ price: `$${priceMatch[0]}`, value: priceValue });
              }
            }
          });
          
          // If we have prices and no per-count, or if we have multiple prices, pick the largest
          if (allPrices.length > 0) {
            if (!hasPerCount || allPrices.length === 1) {
              allPrices.sort((a, b) => b.value - a.value);
              amazonPrice = allPrices[0].price;
            } else {
              // If there's per-count, pick the larger price (main price)
              allPrices.sort((a, b) => b.value - a.value);
              if (allPrices.length >= 2 && allPrices[0].value > allPrices[1].value * 2) {
                // If largest is much bigger, it's likely the main price
                amazonPrice = allPrices[0].price;
              }
            }
          }
        }
      }
      } // End of if (!amazonPrice) block
      
      // Extract discount percentage from the price area
      if (amazonPrice) {
        // Look for discount percentage near the price
        const priceBlock = $('#price, #priceblock_dealprice, #priceblock_ourprice').first();
        const priceBlockText = priceBlock.text();
        
        // Look for patterns like "-34%" in the price block
        const percentMatch = priceBlockText.match(/-(\d+)%/);
        if (percentMatch) {
          discountPercent = `-${percentMatch[1]}%`;
        } else {
          // Try looking in discount badges
          const discountBadge = $('.a-size-large.a-color-price, .a-color-price').first().text().trim();
          const badgeMatch = discountBadge.match(/-?(\d+)%/);
          if (badgeMatch) {
            discountPercent = `-${badgeMatch[1]}%`;
          }
        }
        
        // Format: price with discount if available
        if (discountPercent) {
          amazonPrice = `${amazonPrice} ${discountPercent}`;
        }
      }
      
      // Amazon image extraction (if not already found from JSON-LD)
      if (!amazonImage) {
        amazonImage = 
          $('#landingImage').attr('src') ||
          $('#landingImage').attr('data-old-src') ||
          $('#imgBlkFront').attr('src') ||
          $('.a-dynamic-image').first().attr('src') ||
          $('img[data-a-dynamic-image]').first().attr('data-a-dynamic-image') ||
          "";
        
        // Parse data-a-dynamic-image if it's JSON
        if (!amazonImage && $('img[data-a-dynamic-image]').length) {
          try {
            const dynamicImageData = $('img[data-a-dynamic-image]').first().attr('data-a-dynamic-image');
            if (dynamicImageData) {
              const imageObj = JSON.parse(dynamicImageData);
              const imageKeys = Object.keys(imageObj);
              if (imageKeys.length > 0) {
                amazonImage = imageKeys[0];
              }
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
      
      let parsedImage = amazonImage;
      
      // Amazon description extraction (if not already found from JSON-LD)
      if (!amazonDescription) {
        amazonDescription = 
          $('#productDescription').text().trim() ||
          $('#feature-bullets').text().trim() ||
          $('.a-unordered-list.a-vertical.a-spacing-mini').first().text().trim() ||
          "";
      }
      
      // Extract additional product information
      let productCount = "";
      let dimensions = "";
      let brand = "";
      let rating = "";
      let reviewCount = "";
      
      // Extract count/set information (e.g., "6 Piece", "Set of 3")
      const titleText = amazonTitle || title;
      const countMatch = titleText.match(/(\d+)\s*(?:Piece|piece|Set|set|Pack|pack|Count|count)/i);
      if (countMatch) {
        productCount = `${countMatch[1]} Piece`;
      }
      
      // Extract dimensions from title or description
      const dimensionMatch = (amazonDescription || titleText).match(/(\d+)\s*[×x]\s*(\d+)\s*(?:inches|inch|in|cm|mm)/i);
      if (dimensionMatch) {
        dimensions = `${dimensionMatch[1]} × ${dimensionMatch[2]} ${dimensionMatch[0].includes('cm') ? 'cm' : 'inches'}`;
      }
      
      // Extract brand
      brand = $('#brand').text().trim() || 
              $('a#brand').text().trim() ||
              $('[data-brand]').attr('data-brand') ||
              "";
      
      // Extract rating
      const ratingEl = $('#acrPopover .a-icon-alt, .a-icon-star .a-icon-alt').first();
      if (ratingEl.length) {
        const ratingText = ratingEl.text().trim();
        const ratingMatch = ratingText.match(/([\d.]+)\s*out of/);
        if (ratingMatch) {
          rating = ratingMatch[1];
        }
      }
      
      // Extract review count
      const reviewCountText = $('#acrCustomerReviewText, #acrCustomerReviewLink').first().text().trim();
      const reviewMatch = reviewCountText.match(/([\d,]+)/);
      if (reviewMatch) {
        reviewCount = reviewMatch[1];
      }
      
      // Extract key features/bullet points
      const features: string[] = [];
      $('#feature-bullets li, .a-unordered-list.a-vertical.a-spacing-mini li').each((_, el) => {
        const featureText = $(el).text().trim();
        if (featureText && featureText.length > 10 && featureText.length < 200) {
          features.push(featureText);
        }
      });
      
      // Build enhanced description with all available info
      let enhancedDescription = amazonDescription;
      
      if (features.length > 0 && !enhancedDescription) {
        enhancedDescription = features.slice(0, 3).join(' • ');
      }
      
      // Add product details to description if available
      const details: string[] = [];
      if (productCount) details.push(productCount);
      if (dimensions) details.push(dimensions);
      if (brand) details.push(`Brand: ${brand}`);
      if (rating && reviewCount) details.push(`⭐ ${rating} (${reviewCount} reviews)`);
      
      if (details.length > 0 && enhancedDescription) {
        enhancedDescription = `${enhancedDescription}\n\n${details.join(' • ')}`;
      } else if (details.length > 0) {
        enhancedDescription = details.join(' • ');
      }

      // If we got Amazon-specific data, use it (even if partial)
      // Always return something for Amazon, even if scraping failed
      const finalTitle = amazonTitle || title.trim() || "Amazon Product";
      const finalImage = parsedImage || image || "";
      const finalDescription = enhancedDescription || amazonDescription || description.trim() || "";
      const finalPrice = amazonPrice || "";
      
      // Log what we found for debugging
      console.log("Amazon scraping result:", {
        title: finalTitle,
        hasImage: !!finalImage,
        hasDescription: !!finalDescription,
        price: finalPrice,
        fromJSON: !!amazonTitle || !!amazonPrice || !!amazonImage,
        htmlLength: html.length,
        hasProductTitle: $('#productTitle').length > 0,
        hasPriceBlock: $('#priceblock_dealprice, #priceblock_ourprice, #price').length > 0,
        metaTitle: title.trim(),
        metaImage: image,
        metaDescription: description.trim(),
      });
      
      return {
        title: finalTitle,
        image: finalImage,
        description: finalDescription || "Product from Amazon",
        price: finalPrice,
        url,
      };
    }

    // Helper function to format price
    function formatPrice(priceValue: any, currency?: string): string {
      if (!priceValue) return "";
      
      const num = parseFloat(String(priceValue).replace(/[^\d.]/g, ''));
      if (isNaN(num)) return String(priceValue);
      
      const currencySymbol = currency ? getCurrencySymbol(currency) : '$';
      return `${currencySymbol}${num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    }
    
    // Helper function to get currency symbol
    function getCurrencySymbol(currency: string): string {
      const symbols: Record<string, string> = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'JPY': '¥',
        'CNY': '¥',
        'CAD': 'C$',
        'AUD': 'A$',
      };
      return symbols[currency.toUpperCase()] || '$';
    }
    
    // Helper function to extract price from text
    function extractPriceFromText(text: string): string | null {
      // Remove extra whitespace
      text = text.trim();
      
      // Try to find price pattern
      const patterns = [
        /\$\s*[\d,]+\.?\d{0,2}/,
        /[\d,]+\.?\d{0,2}\s*\$?/,
        /£\s*[\d,]+\.?\d{0,2}/,
        /€\s*[\d,]+\.?\d{0,2}/,
      ];
      
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          return match[0].trim();
        }
      }
      
      // If text looks like just a number, assume it's a price
      const numMatch = text.match(/[\d,]+\.?\d{0,2}/);
      if (numMatch && text.length < 20) { // Only if it's a short string
        return `$${numMatch[0]}`;
      }
      
      return null;
    }


    // Try to extract price from various sources
    let price = "";
    
    // 1. Check JSON-LD structured data (most reliable)
    $('script[type="application/ld+json"]').each((_, el) => {
      if (price) return; // Already found
      try {
        const jsonText = $(el).html() || "{}";
        let json = JSON.parse(jsonText);
        
        // Handle arrays (common in JSON-LD)
        if (Array.isArray(json)) {
          json = json.find((item: any) => item['@type'] === 'Product' || item['@type'] === 'Offer') || json[0];
        }
        
        // Try various price paths in JSON-LD
        if (json.offers) {
          if (Array.isArray(json.offers)) {
            const offer = json.offers.find((o: any) => o.price) || json.offers[0];
            if (offer?.price) {
              price = formatPrice(offer.price, offer.priceCurrency);
            }
          } else if (json.offers.price) {
            price = formatPrice(json.offers.price, json.offers.priceCurrency);
          }
        }
        
        if (!price && json.price) {
          price = formatPrice(json.price, json.priceCurrency);
        }
        
        // Check for aggregateOffer (price range)
        if (!price && json.aggregateOffer) {
          if (json.aggregateOffer.lowPrice) {
            price = formatPrice(json.aggregateOffer.lowPrice, json.aggregateOffer.priceCurrency);
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    });

    // 2. Check meta tags for price
    if (!price) {
      const metaPrice = 
        $('meta[property="product:price:amount"]').attr("content") ||
        ($('meta[property="product:price:currency"]').attr("content") ? 
          $('meta[property="product:price:amount"]').attr("content") : null) ||
        $('meta[name="price"]').attr("content") ||
        $('meta[itemprop="price"]').attr("content") ||
        "";
      
      if (metaPrice) {
        const currency = $('meta[property="product:price:currency"]').attr("content") || 
                        $('meta[itemprop="priceCurrency"]').attr("content") || "";
        price = formatPrice(metaPrice, currency);
      }
    }

    // 3. Amazon-specific price extraction (if isAmazon)
    if (!price && isAmazon) {
      const amazonPriceSelectors = [
        '#priceblock_dealprice .a-offscreen',
        '#priceblock_ourprice .a-offscreen',
        '#price .a-offscreen',
        '.a-price .a-offscreen',
        '[data-a-color="price"] .a-offscreen',
        '.a-price-whole',
        '#priceblock_saleprice .a-offscreen',
        '#priceblock_dealprice',
        '#priceblock_ourprice',
        '.a-price-range .a-offscreen',
        '[data-a-color="base"] .a-offscreen',
      ];
      
      for (const selector of amazonPriceSelectors) {
        const priceEl = $(selector).first();
        if (priceEl.length) {
          let priceText = priceEl.text().trim();
          // For .a-offscreen, also check parent
          if (!priceText && selector.includes('.a-offscreen')) {
            priceText = priceEl.parent().text().trim();
          }
          if (priceText) {
            const priceMatch = priceText.match(/[\d,]+\.?\d*/);
            if (priceMatch) {
              const priceValue = parseFloat(priceMatch[0].replace(/,/g, ''));
              // Filter out per-count prices (usually very small)
              if (priceValue >= 1) {
                price = `$${priceMatch[0]}`;
                break;
              }
            }
          }
        }
      }
      
      // Try to find price in data attributes
      if (!price) {
        const priceData = $('[data-a-color="price"]').first().attr('data-a-color-price');
        if (priceData) {
          const priceMatch = priceData.match(/[\d,]+\.?\d*/);
          if (priceMatch) {
            price = `$${priceMatch[0]}`;
          }
        }
      }
    }

    // 4. Try common CSS selectors for price elements (non-Amazon or fallback)
    if (!price) {
      const priceSelectors = [
        '[itemprop="price"]',
        '.price',
        '.product-price',
        '.current-price',
        '.sale-price',
        '.price-current',
        '[data-price]',
        '.price-value',
        '#price',
        '.product-price-value',
        '.price-amount',
      ];
      
      for (const selector of priceSelectors) {
        const priceEl = $(selector).first();
        if (priceEl.length) {
          const priceText = priceEl.text().trim() || priceEl.attr('content') || priceEl.attr('data-price');
          if (priceText) {
            const extracted = extractPriceFromText(priceText);
            if (extracted) {
              price = extracted;
              break;
            }
          }
        }
      }
    }

    // 5. Try to find price in text (common patterns) - more comprehensive
    if (!price) {
      const pricePatterns = [
        /\$\s*[\d,]+\.?\d{0,2}/,  // $123.45 or $1,234
        /[\d,]+\.?\d{0,2}\s*\$/,  // 123.45$ or 1,234$
        /price[:\s]*\$?\s*[\d,]+\.?\d{0,2}/i,
        /[\d,]+\.?\d{0,2}\s*(USD|EUR|GBP|CAD|JPY|CNY)/i,
        /£\s*[\d,]+\.?\d{0,2}/,   // British pounds
        /€\s*[\d,]+\.?\d{0,2}/,   // Euros
        /¥\s*[\d,]+\.?\d{0,2}/,   // Yen/Yuan
      ];

      for (const pattern of pricePatterns) {
        const matches = html.match(pattern);
        if (matches && matches[0]) {
          price = matches[0].trim();
          break;
        }
      }
    }

    const result = {
      title: title.trim() || "Product",
      image: image || "",
      description: description.trim() || "",
      price: price.trim() || "",
      url,
    };
    
    // Log what we extracted for debugging
    console.log("Scraped result:", {
      hasTitle: !!result.title && result.title !== "Product",
      hasImage: !!result.image,
      hasPrice: !!result.price,
      hasDescription: !!result.description,
      url,
      isAmazon,
    });
    
    return result;
  } catch (error: any) {
    console.error("Scraping error:", error);
    console.error("Error details:", {
      message: error.message,
      url,
      stack: error.stack,
    });
    throw new Error(error.message || "Failed to scrape URL");
  }
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    const data = await scrapeProductData(url);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("API scrape error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to scrape URL" },
      { status: 500 }
    );
  }
}

