import Image from "next/image";
import TestimonialsAvatars from "./TestimonialsAvatars";
import JewelleryPhotoEditor from "@/components/JewelleryPhotoEditor";
import ButtonSignin from "./ButtonSignin";
import config from "@/config";

const Hero = () => {
  return (
    <section className="max-w-7xl mx-auto bg-base-100 flex flex-col lg:flex-col items-center justify-center gap-16 lg:gap-20 px-8 py-8 lg:py-20">
      <div className="flex flex-col gap-10 lg:gap-14 items-center justify-center text-center">
        <h1 className="font-extrabold text-4xl lg:text-6xl tracking-tight md:-mb-4">
          Free, Fast FLUX Kontext
        </h1>
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-700">
          Harness the power of FLUX Kontext AI system for smart text-to-visual creation and effortless image editing using state-of-the-art neural networks.
        </h2>
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        {/* <div className="flex justify-center w-full">
          <ButtonSignin text="Start Free Trial" extraStyle="btn-primary btn-wide text-white" />
        </div> */}
        {/* <TestimonialsAvatars priority={true} /> */}
        {/* <div className="lg:w-full">
          <JewelleryPhotoEditor />
        </div> */}
      </div>
    </section>
  );
};

export default Hero;
