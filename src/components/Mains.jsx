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
import resumePdf from "../assets/resume.pdf";
import { auth, db, rtdb } from "../firebase";
import { readRtdb } from "../services/rtdbCrud";
import "./Mains.css";

export default function Mains() {
  const EMAILJS_SERVICE_ID = "service_t9rrjon";
  const EMAILJS_TEMPLATE_ID = "template_zgg0mlq";
  const EMAILJS_PUBLIC_KEY = "PfhRPH_IlvK14CBQj";
  const RESUME_URL = resumePdf;

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResumeOpen, setIsResumeOpen] = useState(false);

  const openResumeModal = () => setIsResumeOpen(true);
  const closeResumeModal = () => setIsResumeOpen(false);

  useEffect(() => {
    if (!isResumeOpen) {
      return;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeResumeModal();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isResumeOpen]);

  const withTimeout = (promise, ms, label) =>
    Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`${label} timed out`)), ms),
      ),
    ]);

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

    if (isSubmitting) {
      return;
    }

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

      const emailTemplatePayload = {
        // Common sender aliases used in EmailJS templates
        from_name: contactForm.fullName,
        name: contactForm.fullName,
        full_name: contactForm.fullName,
        user_name: contactForm.fullName,

        // Common email aliases
        from_email: contactForm.email,
        email: contactForm.email,
        reply_to: contactForm.email,

        // Contact/message data
        contact: contactForm.contact,
        phone: contactForm.contact,
        message: contactForm.message,

        // Explicit recipient/subject helpers for template setup
        to_name: about.fullName || "Portfolio Admin",
        to_email: about.email || "admin@gmail.com",
        subject: "New Portfolio Contact Message",
      };

      setIsSubmitting(true);
      console.log("Submitting contact form:", contactPayload);

      const results = await Promise.allSettled([
        withTimeout(
          addDoc(collection(db, "contacts"), {
            ...contactPayload,
            createdAt: serverTimestamp(),
          }),
          10000,
          "Firestore save",
        ),
        (async () => {
          const newContactRef = push(ref(rtdb, "contacts"));
          await withTimeout(
            set(newContactRef, {
              ...contactPayload,
              createdAt: Date.now(),
            }),
            10000,
            "Realtime DB save",
          );
        })(),
        withTimeout(
          emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            emailTemplatePayload,
            {
              publicKey: EMAILJS_PUBLIC_KEY,
            },
          ),
          10000,
          "EmailJS send",
        ),
      ]);

      const [firestoreResult, rtdbResult, emailResult] = results;
      const dataSaved =
        firestoreResult.status === "fulfilled" ||
        rtdbResult.status === "fulfilled";

      if (!dataSaved) {
        const reasons = results
          .filter((r) => r.status === "rejected")
          .map((r) => r.reason?.message || "Unknown error")
          .join(" | ");
        throw new Error(reasons || "All contact submit channels failed");
      }

      if (emailResult.status === "rejected") {
        console.error("EmailJS message failed:", emailResult.reason);

        const emailReason =
          emailResult.reason?.text ||
          emailResult.reason?.message ||
          "Unknown EmailJS error";

        setContactStatus({
          type: "success",
          message: `Message saved successfully, but email delivery failed (${emailReason}). Admin can still view it in the dashboard.`,
        });
      } else {
        console.log("EmailJS message sent successfully");
        setContactStatus({
          type: "success",
          message:
            "Message sent successfully! Admin can now view it in the dashboard.",
        });
      }

      console.log("Contact form submitted successfully:", contactPayload);

      setContactForm({
        fullName: "",
        contact: "",
        email: "",
        message: "",
      });
    } catch (error) {
      console.error("Contact Error:", error);

      const readableMessage =
        error?.code === "PERMISSION_DENIED" ||
        String(error?.message || "")
          .toLowerCase()
          .includes("permission")
          ? "Permission denied while saving message. Please log in first or update Firebase rules for contacts."
          : error?.message || "Failed to send message. Please try again.";

      setContactStatus({
        type: "error",
        message: readableMessage,
      });
    } finally {
      setIsSubmitting(false);
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

            <button
              type="button"
              className="resume-btn"
              onClick={openResumeModal}
            >
              View Resume
            </button>
          </div>
        </div>
      </section>

      {isResumeOpen && (
        <div className="resume-modal-backdrop" onClick={closeResumeModal}>
          <div
            className="resume-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Resume preview"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="resume-modal-header">
              <h3>Resume Preview</h3>
              <button
                type="button"
                className="resume-modal-close"
                onClick={closeResumeModal}
                aria-label="Close resume preview"
                title="Close"
              >
                X
              </button>
            </div>

            <div className="resume-modal-body">
              <iframe
                src={`${RESUME_URL}#zoom=page-width&view=FitH`}
                title="Resume PDF"
                className="resume-frame"
              />
            </div>

            <div className="resume-modal-actions">
              <a className="resume-download-btn" href={RESUME_URL} download>
                Download PDF
              </a>
              <a
                className="resume-download-btn resume-open-btn"
                href={RESUME_URL}
                target="_blank"
                rel="noreferrer"
              >
                Open PDF
              </a>
            </div>
          </div>
        </div>
      )}

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

          <button type="submit" className="contact-btn" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Submit Message"}
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
