export default function IntroSection() {
  return (
    <section
      className="flex flex-col justify-between background grow-0 shrink-0 h-full overflow-x-hidden overflow-y-auto px-14 pt-14 pb-8 bg-red-200 w-[37.5rem]"
    >
      <h1 className="text-5xl font-bold">Hello, I'm Chukwudumebi.</h1>
      <div className="border-b w-1/4 my-4"></div>
      <div className="space-y-6 font-extralight text-white text-opacity-75">
        <p>But everybody calls me <span className="font-bold">Dumebi</span>. I'm an undergraduate Computer Engineering student at the University of Lagos.</p>
        <p>I love building fun things, mostly for the web. I enjoy teaching and I am now trying to <a href="/" className="border-b border-dashed">write</a> as much as I can.</p>
        <p>To further my self development, I would like to <a href="/" className="border-b border-dashed">speak</a> at your next event about something interesting.</p>
      </div>
      <a href="#projects" className="mt-6 bg-white w-max rounded-full p-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="#726193" stroke-width="5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </a>
      <style>
        {`
          .background {
            background-image: linear-gradient(45deg, #726193 20%, #e37b7c 60%, #ffe4b4);
          }
        `}
      </style>
    </section>
  );
}
