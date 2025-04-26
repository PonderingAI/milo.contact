import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ExternalLink } from "lucide-react"

export default function MediaHostingGuide() {
  return (
    <div className="bg-gray-900 rounded-lg p-6 mt-8">
      <h2 className="text-2xl font-serif mb-4">Cost-Effective Media Hosting Options</h2>
      <p className="text-gray-300 mb-6">
        Here are some recommended options for hosting your images and videos cost-effectively:
      </p>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>Vercel Blob Storage</AccordionTrigger>
          <AccordionContent>
            <p className="mb-2">
              Vercel Blob is perfect for Next.js projects and offers generous free tier with 1GB storage and 20GB
              bandwidth.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-300">
              <li>Seamless integration with Next.js</li>
              <li>CDN-backed for fast global delivery</li>
              <li>Simple API for uploads and management</li>
              <li>Pricing: Free tier available, then $0.02/GB storage and $0.15/GB bandwidth</li>
            </ul>
            <a
              href="https://vercel.com/docs/storage/vercel-blob"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-400 mt-2 hover:underline"
            >
              Learn more <ExternalLink className="h-3 w-3" />
            </a>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger>Cloudinary</AccordionTrigger>
          <AccordionContent>
            <p className="mb-2">
              Cloudinary specializes in media management with powerful transformation capabilities.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-300">
              <li>On-the-fly image and video transformations</li>
              <li>Automatic optimization for different devices</li>
              <li>Extensive media management features</li>
              <li>Pricing: Free tier with 25GB storage and 25GB bandwidth</li>
            </ul>
            <a
              href="https://cloudinary.com/pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-400 mt-2 hover:underline"
            >
              Learn more <ExternalLink className="h-3 w-3" />
            </a>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger>AWS S3 + CloudFront</AccordionTrigger>
          <AccordionContent>
            <p className="mb-2">Amazon S3 with CloudFront CDN offers scalable storage with global content delivery.</p>
            <ul className="list-disc pl-5 space-y-1 text-gray-300">
              <li>Highly reliable and scalable storage</li>
              <li>Global CDN for fast delivery</li>
              <li>Fine-grained access controls</li>
              <li>Pricing: Pay-as-you-go, starting at $0.023/GB for storage and $0.085/GB for transfer</li>
            </ul>
            <a
              href="https://aws.amazon.com/s3/pricing/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-400 mt-2 hover:underline"
            >
              Learn more <ExternalLink className="h-3 w-3" />
            </a>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-4">
          <AccordionTrigger>Bunny.net</AccordionTrigger>
          <AccordionContent>
            <p className="mb-2">Bunny.net offers affordable CDN and storage services with excellent performance.</p>
            <ul className="list-disc pl-5 space-y-1 text-gray-300">
              <li>Global CDN with 94+ locations</li>
              <li>Optimized for video streaming</li>
              <li>Simple pricing model</li>
              <li>Pricing: Starting at $0.01/GB for storage and $0.01/GB for bandwidth</li>
            </ul>
            <a
              href="https://bunny.net/pricing/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-400 mt-2 hover:underline"
            >
              Learn more <ExternalLink className="h-3 w-3" />
            </a>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-5">
          <AccordionTrigger>Video Platforms (Vimeo, YouTube)</AccordionTrigger>
          <AccordionContent>
            <p className="mb-2">For videos, consider embedding from dedicated platforms rather than self-hosting.</p>
            <ul className="list-disc pl-5 space-y-1 text-gray-300">
              <li>Vimeo Pro: High-quality, customizable player, privacy options ($20/month)</li>
              <li>YouTube: Free unlimited hosting, less control over branding</li>
              <li>Both offer analytics and easy embedding</li>
            </ul>
            <div className="flex gap-4 mt-2">
              <a
                href="https://vimeo.com/upgrade"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-blue-400 hover:underline"
              >
                Vimeo pricing <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="https://www.youtube.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-blue-400 hover:underline"
              >
                YouTube <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="mt-6 p-4 bg-gray-800 rounded-lg">
        <h3 className="text-lg font-medium mb-2">Recommendation</h3>
        <p className="text-gray-300">For your portfolio, a combination approach often works best:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-300">
          <li>Use Vercel Blob for thumbnails and smaller images</li>
          <li>Host videos on Vimeo (for professional control) or YouTube (for free hosting)</li>
          <li>Use Cloudinary for image transformations and galleries</li>
        </ul>
      </div>
    </div>
  )
}
