import { useEffect, useState } from "react";
import { FaSignOutAlt } from "react-icons/fa";
import SoftAurora from "./SoftAurora";

import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import {
  deleteRtdb,
  patchRtdb,
  pushRtdb,
  readRtdb,
  writeRtdb,
} from "../services/rtdbCrud";
import "./Admin.css";
import { useToast } from "./Toast";

export default function Admin() {
  const [active, setActive] = useState("about");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState("info");
  const { pushToast } = useToast();

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
      pushToast("You have been logged out.", { type: "info", title: "Logout" });
      navigate("/login");
    } catch (err) {
      console.error(err);
      pushToast("Logout failed. Please try again.", {
        type: "error",
        title: "Logout",
      });
    }
  };

  const [hobby, setHobby] = useState({ title: "", desc: "" });
  const [project, setProject] = useState({ title: "", desc: "", stack: "" });
  const [editingProjectId, setEditingProjectId] = useState(null);

  const showStatus = (message, type = "info") => {
    setStatusMessage(message);
    setStatusType(type);

    const toastType =
      type === "success" ? "success" : type === "error" ? "error" : "info";
    pushToast(message, {
      type: toastType,
      title:
        type === "success" ? "Success" : type === "error" ? "Error" : "Info",
    });
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
    const unsubContactsRtdb = readRtdb("contacts", (data) => {
      if (!data) {
        setContacts([]);
        return;
      }

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
        Object.entries(data)
          .map(([id, value]) => ({
            id,
            ...value,
          }))
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
      );
    });

    return () => {
      unsubContactsRtdb();
      unsubAbout();
      unsubHobbies();
      unsubProjects();
    };
  }, []);

  const resetProjectForm = () => {
    setProject({ title: "", desc: "", stack: "" });
    setEditingProjectId(null);
  };

  const handleProjectSubmit = async () => {
    if (!project.title.trim() || !project.desc.trim() || !project.stack.trim()) {
      showStatus("Please fill in all project fields.", "error");
      return;
    }

    try {
      if (editingProjectId) {
        showStatus("Updating project...", "info");
        await patchRtdb(`projects/${editingProjectId}`, {
          ...project,
          updatedAt: Date.now(),
        });
        showStatus("Project updated successfully.", "success");
      } else {
        showStatus("Adding project...", "info");
        await pushRtdb("projects", {
          ...project,
          createdAt: Date.now(),
        });
        showStatus("Project added successfully.", "success");
      }

      resetProjectForm();
    } catch (error) {
      handleAdminError(editingProjectId ? "update project" : "add project", error);
    }
  };

  return (
    <>
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

          <button type="button" className="logout-btn" onClick={handleLogout}>
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </aside>

        <main className="admin-content">
          <div className="admin-topbar">
            <h3>Admin Dashboard</h3>
            <button
              type="button"
              className="logout-fixed-btn"
              onClick={handleLogout}
            >
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>

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
                  onChange={(e) =>
                    setAbout({ ...about, [key]: e.target.value })
                  }
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
                onChange={(e) =>
                  setProject({ ...project, desc: e.target.value })
                }
              />
              <input
                placeholder="Tech Stack"
                value={project.stack}
                onChange={(e) =>
                  setProject({ ...project, stack: e.target.value })
                }
              />
              <button
                onClick={handleProjectSubmit}
              >
                {editingProjectId ? "Update" : "Add"}
              </button>
              {editingProjectId && (
                <button type="button" onClick={resetProjectForm}>
                  Cancel Edit
                </button>
              )}

              {projects.map((p) => (
                <div key={p.id} className="admin-card">
                  <b>{p.title}</b>
                  <p>{p.desc}</p>
                  <small>{p.stack}</small>
                  <button
                    type="button"
                    onClick={() => {
                      setProject({
                        title: p.title || "",
                        desc: p.desc || "",
                        stack: p.stack || "",
                      });
                      setEditingProjectId(p.id);
                      showStatus(`Editing "${p.title}"`, "info");
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        showStatus("Deleting project...", "info");
                        await deleteRtdb(`projects/${p.id}`);
                        if (editingProjectId === p.id) {
                          resetProjectForm();
                        }
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
    </>
  );
}
