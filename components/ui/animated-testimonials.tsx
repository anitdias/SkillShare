"use client";

import Image from "next/image";

type Testimonial = {
  quote: string;
  name: string;
  designation: string;
  src: string;
};

export const AnimatedTestimonials = ({
  testimonials,
}: {
  testimonials: Testimonial[];
}) => {
  // Just use the first testimonial
  const testimonial = testimonials[0];

  return (
    <div className="max-w-sm md:max-w-7xl mx-auto antialiased font-sans py-20">
      <div className="relative flex items-center justify-start">
        <div>
          <div className="relative h-40 w-40 mr-10">
            <Image
              src={testimonial.src}
              alt={testimonial.name}
              width={500}
              height={500}
              draggable={false}
              className="h-full w-full rounded-3xl object-cover object-center"
            />
          </div>
        </div>
        <div className="flex justify-between flex-col">
          <h3 className="relative z-10 text-md md:text-6xl bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600 font-sans font-bold">
            {testimonial.name}
          </h3>
          <p className="text-md text-gray-500 dark:text-neutral-500">
            {testimonial.designation}
          </p>
          <p className="text-md mt-5 text-white">
            {testimonial.quote}
          </p>
        </div>
      </div>
    </div>
  );
};