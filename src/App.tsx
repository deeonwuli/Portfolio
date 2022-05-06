import ContactSection from "./components/contact";
import IntroSection from "./components/intro";
import HomeLayout from "./components/layout";
import ProjectsSection from "./components/projects";

export function App() {
  return(
    <HomeLayout>
      <IntroSection />
      <ProjectsSection />
      <ContactSection />
    </HomeLayout>
  ) 
}
