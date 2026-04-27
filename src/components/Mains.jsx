import emailjs from "@emailjs/browser";
import { signOut } from "firebase/auth";
import { push, ref, set } from "firebase/database";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import gsap from "gsap";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  RiArrowRightLine,
  RiBrush3Line,
  RiCheckLine,
  RiCloseLine,
  RiCodeSSlashLine,
  RiDownload2Line,
  RiErrorWarningLine,
  RiExternalLinkLine,
  RiGithubLine,
  RiLinkedinBoxLine,
  RiLinksLine,
  RiLoader4Line,
  RiMailLine,
  RiMapPinLine,
  RiMenuLine,
  RiPhoneLine,
  RiServerLine,
  RiTwitterXLine,
  RiUser3Line,
} from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import profileImg from "../assets/Ahmad.png";
import logo from "../assets/LOGO.png";
import resumePdf from "../assets/resume.pdf";
import { auth, rtdb } from "../firebase";
import { readRtdb } from "../services/rtdbCrud";
import "./Mains.css";
import SoftAurora from "./SoftAurora";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

/* ─── CONSTANTS ─── */
const SKILLS = [
  { label: "React / Next.js", pct: 88 },
  { label: "JavaScript / TypeScript", pct: 85 },
  { label: "Firebase & Databases", pct: 80 },
  { label: "UI / UX Design", pct: 75 },
  { label: "Node.js / Express", pct: 70 },
  { label: "CSS / Tailwind CSS", pct: 90 },
];
const TECH = [
  "React",
  "Next.js",
  "TypeScript",
  "Firebase",
  "Tailwind CSS",
  "Node.js",
  "Figma",
  "Git",
  "REST APIs",
  "Vite",
  "PostgreSQL",
  "Docker",
];
const SERVICES = [
  {
    Icon: RiCodeSSlashLine,
    title: "Web Development",
    desc: "Building fast, accessible, production-ready web applications with modern frameworks and clean architecture.",
  },
  {
    Icon: RiBrush3Line,
    title: "UI / UX Design",
    desc: "Crafting clean, intuitive interfaces with strong visual hierarchy and purposeful micro-interactions.",
  },
  {
    Icon: RiServerLine,
    title: "Firebase & Backend",
    desc: "Architecting real-time databases, secure auth flows, and cloud function pipelines that scale effortlessly.",
  },
  {
    Icon: RiLinksLine,
    title: "API Integration",
    desc: "Seamlessly connecting payment gateways, messaging platforms, and third-party REST services.",
  },
];
const STATS = [
  { num: "4+", label: "Years Learning" },
  { num: "10+", label: "Projects Built" },
  { num: "100%", label: "Dedication" },
];
const FALLBACK_PROJECTS = [
  {
    id: "a",
    title: "LaConsolanet!",
    desc: "Full-stack portfolio management with Firebase real-time database, admin dashboard, and EmailJS integration.",
    stack: "React · MongoDB · JavaScript",
  },
  {
    id: "b",
    title: "E-Commerce Platform",
    desc: "Modern online store with cart, checkout, Stripe payment integration, and full inventory management.",
    stack: "Next.js · Stripe · Supabase",
  },
  {
    id: "c",
    title: "Task Manager App",
    desc: "Collaborative project management tool with drag-and-drop boards, real-time sync, and team workspaces.",
    stack: "React · TypeScript · Firebase",
  },
];

/* ─── PAGE LOADER ─── */
function PageLoader({ onFinish, logo }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setCount((p) => {
        const n = p + Math.floor(Math.random() * 4) + 2;
        if (n >= 100) {
          clearInterval(id);
          setTimeout(onFinish, 380);
          return 100;
        }
        return n;
      });
    }, 22);
    return () => clearInterval(id);
  }, [onFinish]);

  return (
    <motion.div
      className="loader"
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.55, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="loader-body">
        <motion.img
          src={logo}
          alt="Logo"
          className="loader-logo"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        />
        <div className="loader-track">
          <motion.div className="loader-fill" style={{ width: `${count}%` }} />
        </div>
        <motion.span
          className="loader-num"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {String(count).padStart(3, "0")}
        </motion.span>
        <p className="loader-label">Loading portfolio…</p>
      </div>
    </motion.div>
  );
}

/* ═══════════════════ MAIN ═══════════════════ */
export default function Mains() {
  const EMAILJS_SERVICE_ID = "service_t9rrjon";
  const EMAILJS_TEMPLATE_ID = "template_zgg0mlq";
  const EMAILJS_PUBLIC_KEY = "PfhRPH_IlvK14CBQj";
  const RESUME_URL = resumePdf;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [navSolid, setNavSolid] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [isResumeOpen, setIsResumeOpen] = useState(false);
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
  const [contactStatus, setContactStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const wrapperRef = useRef(null);
  const contentRef = useRef(null);
  const smootherRef = useRef(null);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 400, damping: 40 });

  /* ── GSAP ScrollSmoother (init after loader) ── */
  useLayoutEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      smootherRef.current = ScrollSmoother.create({
        wrapper: wrapperRef.current,
        content: contentRef.current,
        smooth: 1.4,
        effects: true,
        normalizeScroll: true,
      });
    });
    return () => ctx.revert();
  }, [loading]);

  /* ── GSAP ScrollTrigger animations ── */
  useLayoutEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      /* fade-up */
      gsap.utils.toArray("[data-gsap='fade-up']").forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 52 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              toggleActions: "play none none none",
            },
          },
        );
      });
      /* stagger children */
      gsap.utils.toArray("[data-gsap='stagger-parent']").forEach((p) => {
        const kids = p.querySelectorAll("[data-gsap='stagger-child']");
        gsap.fromTo(
          kids,
          { opacity: 0, y: 36 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power3.out",
            stagger: 0.1,
            scrollTrigger: {
              trigger: p,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          },
        );
      });
      /* skill bars */
      gsap.utils.toArray(".skill-fill").forEach((bar) => {
        gsap.fromTo(
          bar,
          { width: "0%" },
          {
            width: `${bar.dataset.pct}%`,
            duration: 1.4,
            ease: "power3.out",
            scrollTrigger: {
              trigger: bar,
              start: "top 90%",
              toggleActions: "play none none none",
            },
          },
        );
      });
      /* section headings */
      gsap.utils.toArray(".section-heading").forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 38 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power4.out",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              toggleActions: "play none none none",
            },
          },
        );
      });
      /* dividers */
      gsap.utils.toArray(".divider").forEach((el) => {
        gsap.fromTo(
          el,
          { scaleX: 0, transformOrigin: "left" },
          {
            scaleX: 1,
            duration: 1.1,
            ease: "power4.inOut",
            scrollTrigger: {
              trigger: el,
              start: "top 90%",
              toggleActions: "play none none none",
            },
          },
        );
      });
    }, contentRef);
    return () => ctx.revert();
  }, [loading]);

  /* nav sticky + active section */
  useEffect(() => {
    const fn = () => {
      setNavSolid(window.scrollY > 56);
      const ids = [
        "home",
        "about",
        "skills",
        "services",
        "projects",
        "contact",
      ];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el) {
          const { top, bottom } = el.getBoundingClientRect();
          if (top <= 100 && bottom >= 100) {
            setActiveSection(id);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  /* resume escape */
  useEffect(() => {
    if (!isResumeOpen) return;
    const fn = (e) => {
      if (e.key === "Escape") setIsResumeOpen(false);
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [isResumeOpen]);

  /* firebase */
  useEffect(() => {
    emailjs.init(EMAILJS_PUBLIC_KEY);
    const unA = readRtdb("about/main", (d) => {
      if (d) {
        setAbout({
          fullName: "",
          age: "",
          contact: "",
          email: "",
          address: "",
          description: "",
          ...d,
        });
      }
    });
    const unP = readRtdb("projects", (d) => {
      if (!d) {
        setProjects([]);
        return;
      }

      setProjects(
        Object.entries(d)
          .map(([id, v]) => ({ id, ...v }))
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
      );
    });
    return () => {
      unA();
      unP();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (e) {
      console.error(e);
    }
  };

  const withTimeout = (p, ms, l) =>
    Promise.race([
      p,
      new Promise((_, r) =>
        setTimeout(() => r(new Error(`${l} timed out`)), ms),
      ),
    ]);

  const submitContact = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setContactStatus({ type: "", message: "" });
    if (!contactForm.fullName || !contactForm.email || !contactForm.message) {
      setContactStatus({
        type: "error",
        message: "Please fill in all required fields.",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const p = {
        fullName: contactForm.fullName,
        contact: contactForm.contact,
        email: contactForm.email,
        message: contactForm.message,
      };
      const results = await Promise.allSettled([
        (async () => {
          const r = push(ref(rtdb, "contacts"));
          await withTimeout(
            set(r, { ...p, createdAt: Date.now() }),
            10000,
            "RTDB",
          );
        })(),
        withTimeout(
          emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            {
              from_name: p.fullName,
              from_email: p.email,
              reply_to: p.email,
              contact: p.contact,
              message: p.message,
              to_name: about.fullName || "Admin",
              subject: "New Portfolio Contact",
            },
            { publicKey: EMAILJS_PUBLIC_KEY },
          ),
          10000,
          "EmailJS",
        ),
      ]);
      const [rt, em] = results;
      if (rt.status === "rejected") throw new Error("Save failed");
      setContactStatus({
        type: "success",
        message:
          em.status === "fulfilled"
            ? "Message sent! I'll reply within 24 hours."
            : "Saved! Email had an issue, but I'll still see it.",
      });
      setContactForm({ fullName: "", contact: "", email: "", message: "" });
    } catch (err) {
      setContactStatus({
        type: "error",
        message: err?.message || "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const NAV = [
    { href: "#home", label: "Home" },
    { href: "#about", label: "About" },
    { href: "#skills", label: "Skills" },
    { href: "#services", label: "Services" },
    { href: "#projects", label: "Projects" },
    { href: "#contact", label: "Contact" },
  ];
  const displayProjects = projects.length > 0 ? projects : FALLBACK_PROJECTS;

  return (
    <>
      {/* PAGE BACKGROUND */}
      <div className="page-aurora" aria-hidden="true">
        <SoftAurora
          speed={0.22}
          scale={2.2}
          brightness={0.45}
          color1="#ffffff"
          color2="#bdbdbd"
          noiseFrequency={1.6}
          noiseAmplitude={0.55}
          bandHeight={0.42}
          bandSpread={1}
          octaveDecay={0.12}
          layerOffset={0.12}
          colorSpeed={0.35}
          enableMouseInteraction
          useWindowMouse
          mouseInfluence={0.1}
        />
        <div className="page-aurora-grain" />
        <div className="page-aurora-vignette" />
      </div>

      {/* PROGRESS */}
      <motion.div className="progress-bar" style={{ scaleX }} />

      {/* LOADER */}
      <AnimatePresence>
        {loading && (
          <PageLoader onFinish={() => setLoading(false)} logo={logo} />
        )}
      </AnimatePresence>

      {/* ══ NAVBAR ══ */}
      <motion.header
        className={`navbar${navSolid ? " solid" : ""}`}
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.55, ease: [0.76, 0, 0.24, 1] }}
      >
        <div className="nav-inner">
          <a href="#home" className="nav-brand">
            <img src={logo} alt="Logo" />
          </a>
          <nav className="nav-links" aria-label="Main navigation">
            {NAV.map(({ href, label }) => (
              <a
                key={label}
                href={href}
                className={`nav-item${activeSection === href.slice(1) ? " active" : ""}`}
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="nav-end">
            <button className="btn-primary btn-xs" onClick={handleLogout}>
              Logout
            </button>
            <button
              className="hamburger"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <RiCloseLine size={20} /> : <RiMenuLine size={20} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              className="drawer"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.32, ease: [0.76, 0, 0.24, 1] }}
            >
              <div className="drawer-links">
                {NAV.map(({ href, label }, i) => (
                  <motion.a
                    key={label}
                    href={href}
                    className="drawer-item"
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className="drawer-idx">0{i + 1}</span> {label}
                  </motion.a>
                ))}
              </div>
              <motion.button
                className="btn-primary btn-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                onClick={handleLogout}
              >
                Logout
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* ══ SMOOTH SCROLL WRAPPER ══ */}
      <div id="smooth-wrapper" ref={wrapperRef}>
        <div id="smooth-content" ref={contentRef}>
          {/* HERO */}
          <section className="hero bg-dark" id="home">
            <div className="hero-content">
              <motion.div
                className="available-badge"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: loading ? 0 : 1, y: loading ? 10 : 0 }}
                transition={{ delay: 0.55, duration: 0.5 }}
              >
                <span className="live-dot" /> Available for work
              </motion.div>

              <motion.h1
                className="hero-h1"
                initial={{ opacity: 0, y: 52 }}
                animate={{ opacity: loading ? 0 : 1, y: loading ? 52 : 0 }}
                transition={{
                  delay: 0.7,
                  duration: 0.85,
                  ease: [0.76, 0, 0.24, 1],
                }}
              >
                <span className="hero-greeting">Hello, I'm</span>
                <span className="hero-name">
                  {about.fullName || "Ahmad Verzkhan"}
                </span>
              </motion.h1>

              <motion.p
                className="hero-tagline"
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: loading ? 0 : 1, y: loading ? 22 : 0 }}
                transition={{ delay: 0.88, duration: 0.65 }}
              >
                BSIT 4th Year · Aspiring Web Developer · UI Enthusiast
              </motion.p>

              <motion.div
                className="hero-btns"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: loading ? 0 : 1, y: loading ? 18 : 0 }}
                transition={{ delay: 1.04, duration: 0.6 }}
              >
                <a href="#projects" className="btn-primary">
                  View Work <RiArrowRightLine />
                </a>
                <a href="#contact" className="btn-outline">
                  Let's Talk
                </a>
              </motion.div>

              <motion.div
                className="hero-stats"
                initial={{ opacity: 0 }}
                animate={{ opacity: loading ? 0 : 1 }}
                transition={{ delay: 1.25 }}
              >
                {STATS.map(({ num, label }) => (
                  <div key={label} className="stat-item">
                    <span className="stat-n">{num}</span>
                    <span className="stat-l">{label}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            <motion.div
              className="scroll-hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: loading ? 0 : 1 }}
              transition={{ delay: 1.5 }}
            >
              <div className="scroll-track">
                <div className="scroll-thumb" />
              </div>
              <span>Scroll</span>
            </motion.div>
          </section>

          {/* ABOUT */}
          <section className="section" id="about">
            <div className="container">
              <div className="about-grid">
                {/* image */}
                <div className="about-img-col" data-gsap="fade-up">
                  <div className="photo-wrap">
                    <img
                      src={profileImg}
                      alt="Ahmad Verzkhan"
                      className="profile-photo"
                    />
                    <div className="photo-border" />
                  </div>
                  <div className="status-chip">
                    <span className="chip-dot" />
                    <span>Open to Opportunities</span>
                  </div>
                </div>

                {/* text */}
                <div className="about-text-col">
                  <p className="eyebrow" data-gsap="fade-up">
                    About Me
                  </p>
                  <h2 className="section-heading">
                    Creating products <br />
                    that make <em>sense.</em>
                  </h2>
                  <hr className="divider" />
                  <p className="about-body" data-gsap="fade-up">
                    {about.description ||
                      "I'm a passionate frontend developer and designer focused on building beautiful, functional web experiences. I combine technical skill with design sensibility to create products that people love to use."}
                  </p>

                  <ul className="info-list" data-gsap="stagger-parent">
                    {[
                      ["Full Name", about.fullName, RiUser3Line],
                      ["Age", about.age, null],
                      ["Contact", about.contact, RiPhoneLine],
                      ["Email", about.email, RiMailLine],
                      ["Address", about.address, RiMapPinLine],
                    ].map(([key, val, Icon]) => (
                      <li
                        key={key}
                        className="info-item"
                        data-gsap="stagger-child"
                      >
                        {Icon && (
                          <span className="info-icon">
                            <Icon size={13} />
                          </span>
                        )}
                        <span className="info-key">{key}</span>
                        <span className="info-sep">—</span>
                        <span className="info-val">{val || "—"}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="about-cta" data-gsap="fade-up">
                    <button
                      className="btn-primary"
                      onClick={() => setIsResumeOpen(true)}
                    >
                      View Resume <RiExternalLinkLine />
                    </button>
                    <a href={RESUME_URL} download className="btn-outline">
                      <RiDownload2Line /> Download CV
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SKILLS */}
          <section className="section bg-dark" id="skills">
            <div className="container">
              <p className="eyebrow center" data-gsap="fade-up">
                Expertise
              </p>
              <h2 className="section-heading center">
                Skills &amp; Proficiency
              </h2>
              <hr className="divider" />

              <div className="skills-layout">
                <div className="skill-bars">
                  {SKILLS.map(({ label, pct }) => (
                    <div key={label} className="skill-row">
                      <div className="skill-meta">
                        <span className="skill-label">{label}</span>
                        <span className="skill-pct">{pct}%</span>
                      </div>
                      <div className="skill-track">
                        <div className="skill-fill" data-pct={pct} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="tech-cloud" data-gsap="stagger-parent">
                  {TECH.map((t) => (
                    <span
                      key={t}
                      className="tech-pill"
                      data-gsap="stagger-child"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* SERVICES */}
          <section className="section" id="services">
            <div className="container">
              <p className="eyebrow center" data-gsap="fade-up">
                What I Do
              </p>
              <h2 className="section-heading center">Services</h2>
              <hr className="divider" />

              <div className="services-grid" data-gsap="stagger-parent">
                {SERVICES.map(({ Icon, title, desc }) => (
                  <div
                    key={title}
                    className="service-card"
                    data-gsap="stagger-child"
                  >
                    <div className="svc-icon">
                      <Icon size={22} />
                    </div>
                    <h3 className="svc-title">{title}</h3>
                    <p className="svc-desc">{desc}</p>
                    <span className="svc-arrow">
                      <RiArrowRightLine size={16} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* PROJECTS */}
          <section className="section bg-dark" id="projects">
            <div className="container">
              <p className="eyebrow center" data-gsap="fade-up">
                Portfolio
              </p>
              <h2 className="section-heading center">Selected Projects</h2>
              <hr className="divider" />
              <p className="section-sub center" data-gsap="fade-up">
                A curated selection of work built with modern web technologies.
              </p>

              <div className="projects-grid" data-gsap="stagger-parent">
                {displayProjects.map((p, i) => (
                  <div
                    key={p.id}
                    className="project-card"
                    data-gsap="stagger-child"
                  >
                    <div className="project-top">
                      <span className="project-idx">0{i + 1}</span>
                      <RiExternalLinkLine className="project-ext" size={15} />
                    </div>
                    <h4 className="project-name">{p.title}</h4>
                    <p className="project-desc">{p.desc}</p>
                    <span className="project-stack">{p.stack}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CONTACT */}
          <section className="section" id="contact">
            <div className="container">
              <div className="contact-grid">
                <div className="contact-left">
                  <p className="eyebrow" data-gsap="fade-up">
                    Get In Touch
                  </p>
                  <h2 className="section-heading">
                    Let's build something
                    <br />
                    <em>great together.</em>
                  </h2>
                  <hr className="divider" />
                  <p className="contact-blurb" data-gsap="fade-up">
                    Open to freelance, collaborations, and full-time roles. Send
                    a message and I'll reply within 24 hours.
                  </p>

                  <div className="contact-info" data-gsap="stagger-parent">
                    {[
                      [RiMailLine, about.email || "ahmad@email.com"],
                      [RiPhoneLine, about.contact || "+63 900 000 0000"],
                      [RiMapPinLine, about.address || "Philippines"],
                    ].map(([Icon, val]) => (
                      <div
                        key={val}
                        className="contact-row"
                        data-gsap="stagger-child"
                      >
                        <div className="ci-icon">
                          <Icon size={15} />
                        </div>
                        <span>{val}</span>
                      </div>
                    ))}
                  </div>

                  <div className="socials" data-gsap="fade-up">
                    <a href="#" className="social-link" aria-label="GitHub">
                      <RiGithubLine size={18} />
                    </a>
                    <a href="#" className="social-link" aria-label="LinkedIn">
                      <RiLinkedinBoxLine size={18} />
                    </a>
                    <a href="#" className="social-link" aria-label="Twitter">
                      <RiTwitterXLine size={18} />
                    </a>
                  </div>
                </div>

                <div className="contact-right" data-gsap="fade-up">
                  <form className="c-form" onSubmit={submitContact} noValidate>
                    <AnimatePresence>
                      {contactStatus.message && (
                        <motion.div
                          className={`form-alert ${contactStatus.type}`}
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                        >
                          {contactStatus.type === "success" ? (
                            <RiCheckLine size={14} />
                          ) : (
                            <RiErrorWarningLine size={14} />
                          )}
                          {contactStatus.message}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="form-row">
                      <div className="field">
                        <label htmlFor="cf-name">
                          Full Name <span className="req">*</span>
                        </label>
                        <input
                          id="cf-name"
                          type="text"
                          placeholder="ahmad pamaylaon"
                          value={contactForm.fullName}
                          onChange={(e) =>
                            setContactForm({
                              ...contactForm,
                              fullName: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="field">
                        <label htmlFor="cf-phone">Contact Number</label>
                        <input
                          id="cf-phone"
                          type="text"
                          placeholder="0900 000 0000"
                          value={contactForm.contact}
                          onChange={(e) =>
                            setContactForm({
                              ...contactForm,
                              contact: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="field">
                      <label htmlFor="cf-email">
                        Email Address <span className="req">*</span>
                      </label>
                      <input
                        id="cf-email"
                        type="email"
                        placeholder="ahmad@example.com"
                        value={contactForm.email}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            email: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="cf-msg">
                        Message <span className="req">*</span>
                      </label>
                      <textarea
                        id="cf-msg"
                        placeholder="Tell me what you need…"
                        rows="5"
                        value={contactForm.message}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            message: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn-primary btn-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <RiLoader4Line className="spin" /> Sending…
                        </>
                      ) : (
                        <>
                          Send Message <RiArrowRightLine />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="footer">
            <div className="container footer-row">
              <img src={logo} alt="Footer Brand" className="footer-brand" />
              <p>
                © {new Date().getFullYear()} Ahmad Verzkhan. All rights
                reserved.
              </p>
              <p className="footer-note">Designed &amp; Built with care.</p>
            </div>
          </footer>
        </div>
        {/* /smooth-content */}
      </div>
      {/* /smooth-wrapper */}

      {/* RESUME MODAL */}
      <AnimatePresence>
        {isResumeOpen && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsResumeOpen(false)}
          >
            <motion.div
              className="modal"
              initial={{ opacity: 0, scale: 0.93, y: 28 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 28 }}
              transition={{ duration: 0.38, ease: [0.76, 0, 0.24, 1] }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Resume preview"
            >
              <div className="modal-header">
                <span className="modal-title">Resume Preview</span>
                <button
                  className="modal-close"
                  onClick={() => setIsResumeOpen(false)}
                  aria-label="Close"
                >
                  <RiCloseLine size={17} />
                </button>
              </div>
              <div className="modal-body">
                <iframe
                  src={`${RESUME_URL}#zoom=page-width`}
                  title="Resume PDF"
                  className="resume-frame"
                />
              </div>
              <div className="modal-footer">
                <a href={RESUME_URL} download className="btn-outline btn-sm">
                  <RiDownload2Line /> Download
                </a>
                <a
                  href={RESUME_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary btn-sm"
                >
                  Open PDF <RiExternalLinkLine />
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
