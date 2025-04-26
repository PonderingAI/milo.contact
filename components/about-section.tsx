import Image from "next/image"

export default function AboutSection() {
  return (
    <section id="about" className="py-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-5xl md:text-7xl font-serif mb-8">About Me</h2>
          <p className="text-xl text-gray-300 mb-6">
            I'm Milo Presedo, an AI Solutions Architect and film production professional. Fluent in German, Spanish and
            English, I love diving into the latest AI models, VR technologies, and complex problem-solving.
          </p>
          <p className="text-xl text-gray-300 mb-6">
            My journey combines a solid educational background with hands-on experience in computer science, graphic
            design, and film production. I work as a Director of Photography (DP), 1st and 2nd Assistant Camera (1AC &
            2AC), as well as a drone and underwater operator.
          </p>
          <p className="text-xl text-gray-300">
            In my free time, I enjoy FPV drone flying, scuba diving, and exploring nature, which often inspires my
            landscape and product photography work.
          </p>
        </div>
        <div className="relative h-[600px] rounded-lg overflow-hidden">
          <Image src="/images/profile.jpg" alt="Milo Presedo" fill className="object-cover" />
        </div>
      </div>
    </section>
  )
}
