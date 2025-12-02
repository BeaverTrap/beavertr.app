import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

// Lazy load puppeteer only for Amazon
let puppeteer: any = null;
async function getPuppeteer() {
  if (!puppeteer) {
    puppeteer = await import("puppeteer");
  }
  return puppeteer;
}

async function scrapeAmazonWithPuppeteer(url: string) {
  const puppeteerModule = await getPuppeteer();
  const browser = await puppeteerModule.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for product title to load
    await page.waitForSelector('#productTitle, h1', { timeout: 10000 }).catch(() => {});
    
    // Extract data
    const data = await page.evaluate(() => {
      const getText = (selector: string) => {
        const el = document.querySelector(selector);
        return el ? el.textContent?.trim() || '' : '';
      };
      
      const getAttr = (selector: string, attr: string) => {
        const el = document.querySelector(selector);
        return el ? el.getAttribute(attr) || '' : '';
      };
      
      // Title
      const title = getText('#productTitle') || 
                    getText('h1.a-size-large') ||
                    getText('h1') ||
                    '';
      
      // Price - try multiple selectors
      let price = '';
      const priceSelectors = [
        '#priceblock_dealprice .a-offscreen',
        '#priceblock_ourprice .a-offscreen',
        '#price .a-offscreen',
        '.a-price .a-offscreen',
        '[data-a-color="price"] .a-offscreen',
      ];
      
      for (const selector of priceSelectors) {
        const priceEl = document.querySelector(selector);
        if (priceEl) {
          const priceText = priceEl.textContent?.trim() || '';
          const priceMatch = priceText.match(/[\d,]+\.?\d*/);
          if (priceMatch) {
            const priceValue = parseFloat(priceMatch[0].replace(/,/g, ''));
            // Filter out per-count prices (usually very small)
            if (priceValue >= 5) {
              price = `$${priceMatch[0]}`;
              break;
            }
          }
        }
      }
      
      // Discount percentage
      let discount = '';
      const discountText = document.body.textContent || '';
      const discountMatch = discountText.match(/-(\d+)%/);
      if (discountMatch) {
        discount = `-${discountMatch[1]}%`;
      }
      
      if (price && discount) {
        price = `${price} ${discount}`;
      }
      
      // Image
      const image = getAttr('#landingImage', 'src') ||
                    getAttr('#landingImage', 'data-old-src') ||
                    getAttr('img[data-a-dynamic-image]', 'data-a-dynamic-image') ||
                    '';
      
      // Parse data-a-dynamic-image if it's JSON
      let parsedImage = image;
      if (!parsedImage) {
        const imgEl = document.querySelector('img[data-a-dynamic-image]');
        if (imgEl) {
          const dynamicData = imgEl.getAttribute('data-a-dynamic-image');
          if (dynamicData) {
            try {
              const imageObj = JSON.parse(dynamicData);
              const imageKeys = Object.keys(imageObj);
              if (imageKeys.length > 0) {
                parsedImage = imageKeys[0];
              }
            } catch (e) {
              // Ignore
            }
          }
        }
      }
      
      // Description
      const description = getText('#productDescription') ||
                          getText('#feature-bullets') ||
                          '';
      
      // Try to extract size - look for size selection or size in title/description
      let size = '';
      
      // Check if there's a size selector (common on clothing/shoes/hats)
      const sizeSelectors = [
        '#native_dropdown_selected_size_name',
        '#size_name',
        '.a-button-selected[data-csa-c-content-id*="size"]',
        '#variation_size_name .a-button-selected',
        '#size_name_0',
        '[data-csa-c-content-id*="size"] .a-button-selected',
        '.a-dropdown-container select[name*="size"] option:checked'
      ];
      
      for (const selector of sizeSelectors) {
        const sizeEl = document.querySelector(selector);
        if (sizeEl) {
          const sizeText = sizeEl.textContent?.trim() || sizeEl.getAttribute('value') || '';
          if (sizeText && sizeText !== 'Select' && sizeText !== 'Choose') {
            size = sizeText;
            break;
          }
        }
      }
      
      // Check dropdown for selected size
      if (!size) {
        const sizeDropdown = document.querySelector('select[name*="size"], select[id*="size"]') as HTMLSelectElement;
        if (sizeDropdown && sizeDropdown.selectedIndex > 0) {
          const selectedOption = sizeDropdown.options[sizeDropdown.selectedIndex];
          if (selectedOption && selectedOption.value && selectedOption.value !== '') {
            size = selectedOption.text.trim();
          }
        }
      }
      
      // Check if size options exist (indicates item has sizes)
      const hasSizeOptions = document.querySelector('#variation_size_name, #size_name, [data-csa-c-content-id*="size"]') !== null;
      
      // Try to extract from title (e.g., "T-Shirt - Large", "Shoes Size 10")
      if (!size) {
        const titleText = title.toLowerCase();
        const sizeMatch = titleText.match(/\b(size|sz)[:\s]*([a-z0-9]+)\b/i) || 
                         titleText.match(/\b(xs|s|m|l|xl|xxl|xxxl|2xl|3xl|4xl|5xl)\b/i) ||
                         titleText.match(/\b(\d+)\s*(?:inch|in|cm|mm)\b/i);
        if (sizeMatch) {
          size = sizeMatch[2] || sizeMatch[1] || sizeMatch[0];
        }
      }
      
      return { title, price, image: parsedImage, description, size, hasSizeOptions };
    });
    
    return data;
  } finally {
    await browser.close();
  }
}

export async function scrapeProductData(url: string) {
  try {
    if (!url || typeof url !== "string") {
      throw new Error("URL is required");
    }

    // Fetch the page with better headers for Amazon
    const isAmazon = url.includes("amazon.com") || url.includes("amzn.to");
    
    // For Amazon, use Puppeteer to handle JavaScript-rendered content
    if (isAmazon) {
      try {
        console.log("Using Puppeteer for Amazon URL:", url);
        const amazonData = await scrapeAmazonWithPuppeteer(url);
        
        // If we got data from Puppeteer, return it
        if (amazonData.title || amazonData.price || amazonData.image) {
          return {
            title: amazonData.title || "Amazon Product",
            image: amazonData.image || "",
            description: amazonData.description || "Product from Amazon",
            price: amazonData.price || "",
            size: amazonData.size || "",
            hasSizeOptions: amazonData.hasSizeOptions || false,
            url,
          };
        }
      } catch (puppeteerError: any) {
        console.error("Puppeteer scraping failed, falling back to cheerio:", puppeteerError.message);
        // Fall through to cheerio scraping
      }
    }
    
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
      // Continue anyway, might still get some data
    }
    
    const $ = cheerio.load(html);

    // Extract metadata first (needed for fallbacks)
    // Try multiple sources for title
    let title =
      $('meta[property="og:title"]').attr("content")?.trim() ||
      $('meta[name="twitter:title"]').attr("content")?.trim() ||
      $("title").text()?.trim() ||
      $('h1').first().text()?.trim() ||
      "";

    let image =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content") ||
      $('meta[property="og:image:url"]').attr("content") ||
      "";

    let description =
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="twitter:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      "";

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

    // 3. Try common CSS selectors for price elements
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

    // 4. Try to find price in text (common patterns) - more comprehensive
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

