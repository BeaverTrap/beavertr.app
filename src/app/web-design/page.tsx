import PageShell from "@/components/PageShell";
import Link from "next/link";
import Image from "next/image";

export default function WebDesignPage() {
  return (
    <PageShell title="Web Design">
      <div className="prose max-w-none text-base-content">
        {/* Skills Overview */}
        <div className="mb-12 bg-base-200 rounded-lg p-8 border border-base-300">
          <h2 className="text-2xl font-bold text-base-content mb-4">Web Development Approach</h2>
          <p className="text-lg leading-relaxed mb-6">
            I build clean, performant websites with a focus on user experience and visual design. My work combines modern development practices with attention to detail, ensuring sites are both functional and visually engaging.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-xl font-semibold text-base-content mb-3">Technologies & Tools</h3>
              <ul className="space-y-2 text-base list-none text-base-content">
                <li className="flex items-start">
                  <span className="text-primary mr-3 mt-1 flex-shrink-0">•</span>
                  <span><strong className="text-base-content font-bold">Next.js</strong> & React for modern, scalable applications</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-3 mt-1 flex-shrink-0">•</span>
                  <span><strong className="text-base-content font-bold">TypeScript</strong> for type-safe development</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-3 mt-1 flex-shrink-0">•</span>
                  <span><strong className="text-base-content font-bold">Tailwind CSS</strong> for efficient, responsive styling</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-3 mt-1 flex-shrink-0">•</span>
                  <span><strong className="text-base-content font-bold">Drizzle ORM</strong> & SQLite for database management</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-3 mt-1 flex-shrink-0">•</span>
                  <span><strong className="text-base-content font-bold">NextAuth.js</strong> for authentication</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-3 mt-1 flex-shrink-0">•</span>
                  <span><strong className="text-base-content font-bold">Adobe Creative Suite</strong> for design and image processing</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-base-content mb-3">Focus Areas</h3>
              <ul className="space-y-2 text-base list-none">
                <li className="flex items-start">
                  <span className="text-blue-400 mr-3 mt-1 flex-shrink-0">•</span>
                  <span>Responsive design that works across all devices</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-3 mt-1 flex-shrink-0">•</span>
                  <span>Performance optimization and fast load times</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-3 mt-1 flex-shrink-0">•</span>
                  <span>Clean, maintainable code architecture</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-3 mt-1 flex-shrink-0">•</span>
                  <span>Image optimization for high-quality art reproduction</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-3 mt-1 flex-shrink-0">•</span>
                  <span>User-friendly navigation and content structure</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-3 mt-1 flex-shrink-0">•</span>
                  <span>Ongoing maintenance and support</span>
                </li>
              </ul>
            </div>
          </div>
          
          <p className="text-base leading-relaxed text-base-content/70 italic border-l-4 border-primary pl-4">
            I work with artists, creators, and businesses to build websites that effectively showcase their work while maintaining clean design and solid technical foundations.
          </p>
        </div>
        
        {/* Projects Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-base-content mb-4">
            <Link 
              href="https://corywoodall.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-base-content hover:text-primary transition-colors"
            >
              CoryWoodall.com
            </Link>
          </h2>
          
          <div className="mb-6 rounded-lg overflow-hidden border border-base-300 shadow-lg">
            <Link 
              href="https://corywoodall.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block"
            >
              <Image
                src="/images/corywoodall-screenshot.png"
                alt="CoryWoodall.com website screenshot"
                width={1200}
                height={800}
                className="w-full h-auto"
              />
            </Link>
          </div>
          
          <p className="text-lg leading-relaxed mb-6">
            A portfolio website for <strong className="text-base-content font-bold">Cory Woodall</strong>, an artist specializing in cyanotype photography and botanical studies. Cyanotype was the first photographic process that women were able to practice freely, making it historically significant in women's studies and the history of photography. Cory's work continues this tradition, using the medium to explore botanical subjects and contributing to the ongoing dialogue around women's artistic practice and scientific documentation.
          </p>
          
          <div className="bg-base-200 border-l-4 border-primary pl-6 py-4 rounded-r-lg mb-6">
            <h3 className="text-xl font-semibold text-base-content mb-3">My Role</h3>
            <p className="text-base leading-relaxed mb-4 text-base-content">
              As <strong className="text-base-content font-bold">Web Designer</strong> and <strong className="text-base-content font-bold">Studio Assistant</strong>, I handle the full design and development of the site, ensuring it presents Cory's work in a clean, professional manner that matches the precision and care evident in the artwork itself.
            </p>
            <p className="text-base leading-relaxed mb-4 text-base-content">
              This includes site architecture, responsive design, image optimization for high-quality art reproduction, navigation structure, and ongoing maintenance. The site serves as both a portfolio and an educational resource, with sections for About, Portfolio, Contact, and FAQ that help visitors understand the cyanotype process and Cory's artistic practice.
            </p>
            <p className="text-base leading-relaxed mb-4 text-base-content">
              Beyond the technical build, I also provide <strong className="text-base-content font-bold">photography</strong> and <strong className="text-base-content font-bold">content creation</strong> services. Using my <strong className="text-base-content font-bold">Nikon D300s</strong> and <strong className="text-base-content font-bold">Adobe editing skills</strong>, I capture and process high-quality documentation of the artist at work during field sessions, residencies, and studio processes. I also write articles for the site, crafting clear, engaging narratives that maintain the established voice and tone while effectively communicating the artistic concepts and processes.
            </p>
            <p className="text-base leading-relaxed text-base-content">
              I work <strong className="text-base-content font-bold">remotely</strong> and travel for <strong className="text-base-content font-bold">events and residencies</strong>, providing on-site documentation and support when needed while maintaining consistent communication and project continuity regardless of location.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-base-200 text-base-content rounded-full text-sm border border-base-300">Portfolio Design</span>
            <span className="px-3 py-1 bg-base-200 text-base-content rounded-full text-sm border border-base-300">Image Optimization</span>
            <span className="px-3 py-1 bg-base-200 text-base-content rounded-full text-sm border border-base-300">Responsive Layout</span>
            <span className="px-3 py-1 bg-base-200 text-base-content rounded-full text-sm border border-base-300">Content Management</span>
            <span className="px-3 py-1 bg-base-200 text-base-content rounded-full text-sm border border-base-300">Ongoing Support</span>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

