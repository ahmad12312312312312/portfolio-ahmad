import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { FaSignOutAlt } from "react-icons/fa";

import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  deleteRtdb,
  pushRtdb,
  readRtdb,
  writeRtdb,
} from "../services/rtdbCrud";
import "./Admin.css";

export default function Admin() {
  const [active, setActive] = useState("about");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState("info");

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
  const [contacts, setContacts] = useState([]);
  const aboutFields = {
    fullName: "Full Name",
    age: "Age",
    contact: "Contact Number",
    email: "Email Address",
    address: "Address",
    description: "About Description",
  };

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error(err);
    }
  };

  const [hobby, setHobby] = useState({ title: "", desc: "" });
  const [project, setProject] = useState({ title: "", desc: "", stack: "" });

  const showStatus = (message, type = "info") => {
    setStatusMessage(message);
    setStatusType(type);
  };

  const handleAdminError = (action, error) => {
    console.error(`Admin ${action} failed:`, error);
    showStatus(
      error?.code === "PERMISSION_DENIED"
        ? "Permission denied. Check RTDB rules and login state."
        : `Failed to ${action}. Please try again.`,
      "error",
    );
  };

  useEffect(() => {
    let hasRtdbContacts = false;

    const unsubContactsFs = onSnapshot(collection(db, "contacts"), (snap) => {
      if (!hasRtdbContacts) {
        setContacts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }
    });

    const unsubContactsRtdb = readRtdb("contacts", (data) => {
      if (!data) {
        if (!hasRtdbContacts) {
          setContacts([]);
        }
        return;
      }

      hasRtdbContacts = true;
      const mappedContacts = Object.entries(data)
        .map(([id, value]) => ({ id, ...value }))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      setContacts(mappedContacts);
    });

    const unsubAbout = readRtdb("about/main", (data) => {
      if (data) {
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

    const unsubHobbies = readRtdb("hobbies", (data) => {
      if (!data) {
        setHobbies([]);
        return;
      }

      setHobbies(
        Object.entries(data).map(([id, value]) => ({
          id,
          ...value,
        })),
      );
    });

    const unsubProjects = readRtdb("projects", (data) => {
      if (!data) {
        setProjects([]);
        return;
      }

      setProjects(
        Object.entries(data).map(([id, value]) => ({
          id,
          ...value,
        })),
      );
    });

    return () => {
      unsubContactsFs();
      unsubContactsRtdb();
      unsubAbout();
      unsubHobbies();
      unsubProjects();
    };
  }, []);

  return (
    <div className="admin-wrap">
      <aside className="admin-sidebar">
        <h2>Admin</h2>

        {["about", "hobbies", "projects", "contacts"].map((tab) => (
          <button
            key={tab}
            className={active === tab ? "active" : ""}
            onClick={() => setActive(tab)}
          >
            {tab.toUpperCase()}
          </button>
        ))}

        <button className="logout-btn" onClick={handleLogout}>
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </aside>

      <main className="admin-content">
        {statusMessage && (
          <div className={`admin-status ${statusType}`}>
            <span>{statusMessage}</span>
            <button
              type="button"
              onClick={() => setStatusMessage("")}
              aria-label="Dismiss status"
            >
              ×
            </button>
          </div>
        )}

        {active === "about" && (
          <>
            <h3>Edit About</h3>

            {Object.entries(aboutFields).map(([key, label]) => (
              <input
                key={key}
                value={about[key]}
                placeholder={label}
                onChange={(e) => setAbout({ ...about, [key]: e.target.value })}
              />
            ))}
            <button
              onClick={async () => {
                try {
                  showStatus("Saving about changes...", "info");
                  await writeRtdb("about/main", about);
                  showStatus("About updated successfully.", "success");
                } catch (error) {
                  handleAdminError("save about", error);
                }
              }}
            >
              Save
            </button>
          </>
        )}

        {active === "hobbies" && (
          <>
            <h3>Hobbies</h3>
            <input
              placeholder="Title"
              value={hobby.title}
              onChange={(e) => setHobby({ ...hobby, title: e.target.value })}
            />
            <input
              placeholder="Description"
              value={hobby.desc}
              onChange={(e) => setHobby({ ...hobby, desc: e.target.value })}
            />
            <button
              onClick={async () => {
                try {
                  showStatus("Adding hobby...", "info");
                  await pushRtdb("hobbies", {
                    ...hobby,
                    createdAt: Date.now(),
                  });
                  setHobby({ title: "", desc: "" });
                  showStatus("Hobby added successfully.", "success");
                } catch (error) {
                  handleAdminError("add hobby", error);
                }
              }}
            >
              Add
            </button>

            {hobbies.map((h) => (
              <div key={h.id} className="admin-card">
                <b>{h.title}</b>
                <p>{h.desc}</p>
                <button
                  onClick={async () => {
                    try {
                      showStatus("Deleting hobby...", "info");
                      await deleteRtdb(`hobbies/${h.id}`);
                      showStatus("Hobby deleted successfully.", "success");
                    } catch (error) {
                      handleAdminError("delete hobby", error);
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </>
        )}

        {active === "projects" && (
          <>
            <h3>Projects</h3>
            <input
              placeholder="Title"
              value={project.title}
              onChange={(e) =>
                setProject({ ...project, title: e.target.value })
              }
            />
            <input
              placeholder="Description"
              value={project.desc}
              onChange={(e) => setProject({ ...project, desc: e.target.value })}
            />
            <input
              placeholder="Tech Stack"
              value={project.stack}
              onChange={(e) =>
                setProject({ ...project, stack: e.target.value })
              }
            />
            <button
              onClick={async () => {
                try {
                  showStatus("Adding project...", "info");
                  await pushRtdb("projects", {
                    ...project,
                    createdAt: Date.now(),
                  });
                  setProject({ title: "", desc: "", stack: "" });
                  showStatus("Project added successfully.", "success");
                } catch (error) {
                  handleAdminError("add project", error);
                }
              }}
            >
              Add
            </button>

            {projects.map((p) => (
              <div key={p.id} className="admin-card">
                <b>{p.title}</b>
                <p>{p.desc}</p>
                <small>{p.stack}</small>
                <button
                  onClick={async () => {
                    try {
                      showStatus("Deleting project...", "info");
                      await deleteRtdb(`projects/${p.id}`);
                      showStatus("Project deleted successfully.", "success");
                    } catch (error) {
                      handleAdminError("delete project", error);
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </>
        )}

        {active === "contacts" && (
          <>
            <h3>Messages</h3>
            {contacts.map((c) => (
              <div key={c.id} className="admin-card">
                <b>{c.fullName}</b> ({c.email})<p>{c.message}</p>
                <small>
                  {c.createdAt?.toDate
                    ? c.createdAt.toDate().toLocaleString()
                    : c.createdAt
                      ? new Date(c.createdAt).toLocaleString()
                      : ""}
                </small>
              </div>
            ))}
          </>
        )}
      </main>
    </div>
  );
}
