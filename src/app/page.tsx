import Image from "next/image";

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto w-fit text-pretty flex items-center justify-center gap-6 mt-[30dvh]">
      <Image
        src="/cdb-logo-transparent.png"
        alt="Company DB logo"
        width={96}
        height={96}
        className="shrink-0 w-16 sm:w-32"
      />

      <div className="flex flex-col items-center justify-center">
        <h2 className="text-md sm:text-3xl">Welcome to the new old </h2>

        <h1 className="text-lg sm:text-5xl font-bold grow-0">
          Company Database
        </h1>
      </div>
    </div>
  );
}
