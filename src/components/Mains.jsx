import emailjs from "@emailjs/browser";
import { signOut } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import profileImg from "../assets/Ahmad.png";
import { auth, db } from "../firebase";
import "./Mains.css";

export default function Mains() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error(err);
    }
  };

  const [teams, setTeams] = useState([]);
  const [conference, setConference] = useState("All");
  const [search, setSearch] = useState("");
  const [players, setPlayers] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);

  useEffect(() => {
    fetch("https://raw.githubusercontent.com/bttmly/nba/master/data/teams.json")
      .then((res) => res.json())
      .then((data) => setTeams(data));
  }, []);
  const searchedTeams = teams.filter((team) => {
    if (
      conference !== "All" &&
      team.conference?.toLowerCase() !== conference.toLowerCase()
    ) {
      return false;
    }

    const name = `${team.city} ${team.teamName}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const getLogo = (teamId) =>
    `https://cdn.nba.com/logos/nba/${teamId}/global/L/logo.svg`;

  const fetchPlayers = (teamId, teamName) => {
    setSelectedTeam(teamName);

    fetch(`https://www.balldontlie.io/api/v1/players?team_ids[]=${teamId}`)
      .then((res) => res.json())
      .then((data) => setPlayers(data.data));
  };
  const saveFavorite = async (team) => {
    await setDoc(doc(db, "favorites", team.teamId.toString()), team);
    alert(`${team.city} ${team.teamName} saved as favorite ❤️`);
  };

  const [about, setAbout] = useState({
    fullName: "",
    age: "",
    contact: "",
    email: "",
    address: "",
    description: "",
  });

  const [hobbies, setHobbies] = useState([]);
  const [projects, setProjects] = useState([]);

  const [contactForm, setContactForm] = useState({
    fullName: "",
    contact: "",
    email: "",
    message: "",
  });

  useEffect(() => {
    const unsubAbout = onSnapshot(doc(db, "about", "main"), (snap) => {
      if (snap.exists()) setAbout(snap.data());
    });

    const unsubHobbies = onSnapshot(collection(db, "hobbies"), (snap) => {
      setHobbies(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubProjects = onSnapshot(collection(db, "projects"), (snap) => {
      setProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubAbout();
      unsubHobbies();
      unsubProjects();
    };
  }, []);

  const submitContact = async (e) => {
    e.preventDefault();

    if (!contactForm.fullName || !contactForm.email || !contactForm.message) {
      alert("Please complete the form");
      return;
    }

    try {
      await addDoc(collection(db, "contacts"), {
        fullName: contactForm.fullName,
        contact: contactForm.contact,
        email: contactForm.email,
        message: contactForm.message,
        createdAt: serverTimestamp(),
      });

      await emailjs.send(
        "service_3iozakx",
        "template_si8tghz",
        {
          from_name: contactForm.fullName,
          from_email: contactForm.email,
          contact: contactForm.contact,
          message: contactForm.message,
        },
        "sh39lvJNKWLHKsjel",
      );

      alert("Message sent successfully!");

      setContactForm({
        fullName: "",
        contact: "",
        email: "",
        message: "",
      });
    } catch (error) {
      console.error("Contact Error:", error);
      alert("Failed to send message. Please try again.");
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
            <a href="#hobby">Hobby</a>
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

      {selectedTeam && (
        <section className="section">
          <h2>{selectedTeam} Players</h2>

          <ul className="player-list">
            {players.map((p) => (
              <li key={p.id}>
                {p.first_name} {p.last_name} — {p.position || "N/A"}
              </li>
            ))}
          </ul>
        </section>
      )}

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

      {/* ===== HOBBIES ===== */}
      <section className="section hobbies" id="hobby">
        <h2>Hobbies</h2>

        <div className="hobby-grid">
          {hobbies.map((h) => (
            <div key={h.id} className="hobby-card">
              <h4>{h.title}</h4>
              <p>{h.desc}</p>
            </div>
          ))}
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
