import emailjs from "@emailjs/browser";
import { signOut } from "firebase/auth";
import { push, ref, set } from "firebase/database";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import profileImg from "../assets/Ahmad.png";
import { auth, db, rtdb } from "../firebase";
import { readRtdb } from "../services/rtdbCrud";
import "./Mains.css";

export default function Mains() {
  const EMAILJS_SERVICE_ID = "service_pusj32g";
  const EMAILJS_TEMPLATE_ID = "template_zgg0mlq";
  const EMAILJS_PUBLIC_KEY = "OZV8aU2hlwliKruSK_lBf";

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error(err);
    }
  };

  const [about, setAbout] = useState({
    fullName: "",
    age: "",
    contact: "",
    email: "",
    address: "",
    description: "",
  });

  const [projects, setProjects] = useState([]);

  const [contactForm, setContactForm] = useState({
    fullName: "",
    contact: "",
    email: "",
    message: "",
  });
  const [contactStatus, setContactStatus] = useState({
    type: "",
    message: "",
  });

  useEffect(() => {
    emailjs.init(EMAILJS_PUBLIC_KEY);
    console.log("EmailJS initialized for contact form");
  }, []);

  useEffect(() => {
    let hasRtdbAbout = false;
    let hasRtdbProjects = false;

    const unsubAbout = readRtdb("about/main", (data) => {
      if (data) {
        hasRtdbAbout = true;
        setAbout({
          fullName: "",
          age: "",
          contact: "",
          email: "",
          address: "",
          description: "",
          ...data,
        });
      }
    });

    const unsubProjects = readRtdb("projects", (data) => {
      if (!data) {
        return;
      }

      hasRtdbProjects = true;
      const mappedProjects = Object.entries(data).map(([id, value]) => ({
        id,
        ...value,
      }));
      setProjects(mappedProjects);
    });

    const unsubAboutFs = onSnapshot(doc(db, "about", "main"), (snap) => {
      if (!hasRtdbAbout && snap.exists()) {
        setAbout(snap.data());
      }
    });

    const unsubProjectsFs = onSnapshot(collection(db, "projects"), (snap) => {
      if (!hasRtdbProjects) {
        setProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }
    });

    return () => {
      unsubAbout();
      unsubProjects();
      unsubAboutFs();
      unsubProjectsFs();
    };
  }, []);

  const submitContact = async (e) => {
    e.preventDefault();
    setContactStatus({ type: "", message: "" });

    if (!contactForm.fullName || !contactForm.email || !contactForm.message) {
      const message = "Please complete the form";
      console.error("Contact form validation failed:", message, contactForm);
      setContactStatus({ type: "error", message });
      return;
    }

    try {
      const contactPayload = {
        fullName: contactForm.fullName,
        contact: contactForm.contact,
        email: contactForm.email,
        message: contactForm.message,
      };

      console.log("Submitting contact form:", contactPayload);

      try {
        await addDoc(collection(db, "contacts"), {
          ...contactPayload,
          createdAt: serverTimestamp(),
        });
        console.log("Contact saved to Firestore");
      } catch (firestoreError) {
        console.error("Firestore contact save failed:", firestoreError);
      }

      try {
        const newContactRef = push(ref(rtdb, "contacts"));
        await set(newContactRef, {
          ...contactPayload,
          createdAt: Date.now(),
        });
        console.log("Contact saved to RTDB");
      } catch (rtdbError) {
        console.error("RTDB contact save failed:", rtdbError);
      }

      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        from_name: contactForm.fullName,
        from_email: contactForm.email,
        contact: contactForm.contact,
        message: contactForm.message,
      });

      console.log("EmailJS message sent successfully");

      console.log("Contact form submitted successfully:", contactPayload);
      setContactStatus({
        type: "success",
        message:
          "Message sent successfully! Admin can now view it in the dashboard.",
      });

      setContactForm({
        fullName: "",
        contact: "",
        email: "",
        message: "",
      });
    } catch (error) {
      console.error("Contact Error:", error);
      setContactStatus({
        type: "error",
        message: "Failed to send message. Please try again.",
      });
    }
  };

  return (
    <>
      <header className="navbar">
        <div className="nav-inner">
          <h3 className="logo">Welcome to my Portfolio!</h3>

          <nav className="nav-links">
            <a href="#home">Home</a>
            <a href="#about">About</a>
            <a href="#projects">Projects</a>
            <a href="#contact">Contact</a>

            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </nav>
        </div>
      </header>

      <section className="hero" id="home">
        <h1>
          Hello, I’m <span>{about.fullName || "Ahmad Verzkhan"}</span>
        </h1>
        <p>A BSIT 4th year student and aspiring web developer.</p>
      </section>

      <section className="about" id="about">
        <div className="about-inner">
          <div className="about-image">
            <img src={profileImg} alt="Profile" />
          </div>

          <div className="about-content">
            <h2>About Me</h2>
            <p>{about.description}</p>

            <ul className="about-info">
              <li>
                <strong>Full Name:</strong> {about.fullName}
              </li>
              <li>
                <strong>Age:</strong> {about.age}
              </li>
              <li>
                <strong>Contact:</strong> {about.contact}
              </li>
              <li>
                <strong>Email:</strong> {about.email}
              </li>
              <li>
                <strong>Address:</strong> {about.address}
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ===== PROJECTS ===== */}
      <section className="section projects" id="projects">
        <h2>Projects</h2>
        <p className="section-desc">
          Some of the projects I’ve worked on using modern web technologies.
        </p>

        <div className="project-grid">
          {projects.map((p) => (
            <div key={p.id} className="project-card">
              <h4>{p.title}</h4>
              <p>{p.desc}</p>
              <span>{p.stack}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CONTACT ===== */}
      <section className="section contact" id="contact">
        <h2>Contact Me</h2>
        <p className="section-desc">
          Feel free to send me a message. I’ll get back to you as soon as
          possible.
        </p>

        <form className="contact-form" onSubmit={submitContact}>
          {contactStatus.message && (
            <div className={`contact-status ${contactStatus.type}`}>
              {contactStatus.message}
            </div>
          )}

          <div className="form-row">
            <input
              type="text"
              placeholder="Full Name"
              value={contactForm.fullName}
              onChange={(e) =>
                setContactForm({ ...contactForm, fullName: e.target.value })
              }
              required
            />
            <input
              type="text"
              placeholder="Contact Number"
              value={contactForm.contact}
              onChange={(e) =>
                setContactForm({ ...contactForm, contact: e.target.value })
              }
            />
          </div>

          <input
            type="email"
            placeholder="Email Address"
            value={contactForm.email}
            onChange={(e) =>
              setContactForm({ ...contactForm, email: e.target.value })
            }
            required
          />

          <textarea
            placeholder="Your Message"
            rows="5"
            value={contactForm.message}
            onChange={(e) =>
              setContactForm({ ...contactForm, message: e.target.value })
            }
            required
          />

          <button type="submit" className="contact-btn">
            Submit Message
          </button>
        </form>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        <p>© {new Date().getFullYear()} Ahmad Verzkhan. All rights reserved.</p>
      </footer>
    </>
  );
}
