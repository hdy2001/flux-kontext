import Image from "next/image";
import ButtonSignin from "./ButtonSignin";
import config from "@/config";

const CTA = () => {
  return (
    <section className="relative hero overflow-hidden min-h-screen">
      <Image
        src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2990&q=80"
        alt="Luxury jewellery background"
        className="object-cover w-full"
        fill
      />
      <div className="relative hero-overlay bg-neutral bg-opacity-70"></div>
      <div className="relative hero-content text-center text-neutral-content p-8">
        <div className="flex flex-col items-center max-w-xl p-8 md:p-0">
          <h2 className="font-bold text-3xl md:text-5xl tracking-tight mb-8 md:mb-12">
            Professional jewellery photos in seconds.
          </h2>
          <p className="text-lg opacity-80 mb-12 md:mb-16">
            Stop struggling with expensive photography and complex editing software...
          </p>
          <ButtonSignin text="Get Account →" extraStyle="btn-primary text-white btn-wide" />
        </div>
      </div>
    </section>
  );
};

export default CTA;
