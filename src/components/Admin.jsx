import { useEffect, useState } from "react";
import {
    collection, doc, addDoc, deleteDoc,
    setDoc, onSnapshot, serverTimestamp
} from "firebase/firestore";
import { FaSignOutAlt } from "react-icons/fa";

import { db } from "../firebase";
import "./Admin.css";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function Admin() {
    const [active, setActive] = useState("about");

    const [about, setAbout] = useState({
        fullName: "", age: "", contact: "", email: "", address: "", description: ""
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
        description: "About Description"
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

    useEffect(() => {
        onSnapshot(doc(db, "about", "main"), snap => {
            if (snap.exists()) setAbout(snap.data());
        });

        onSnapshot(collection(db, "hobbies"), snap =>
            setHobbies(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        );

        onSnapshot(collection(db, "projects"), snap =>
            setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        );

        onSnapshot(collection(db, "contacts"), snap =>
            setContacts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        );
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
                                await setDoc(doc(db, "about", "main"), about, { merge: true });
                                alert("About updated successfully");
                            }}
                        >
                            Save
                        </button>

                    </>
                )}

                {active === "hobbies" && (
                    <>
                        <h3>Hobbies</h3>
                        <input placeholder="Title" value={hobby.title}
                            onChange={e => setHobby({ ...hobby, title: e.target.value })} />
                        <input placeholder="Description" value={hobby.desc}
                            onChange={e => setHobby({ ...hobby, desc: e.target.value })} />
                        <button onClick={() => addDoc(collection(db, "hobbies"), { ...hobby, createdAt: serverTimestamp() })}>
                            Add
                        </button>

                        {hobbies.map(h => (
                            <div key={h.id} className="admin-card">
                                <b>{h.title}</b>
                                <p>{h.desc}</p>
                                <button onClick={() => deleteDoc(doc(db, "hobbies", h.id))}>Delete</button>
                            </div>
                        ))}
                    </>
                )}

                {active === "projects" && (
                    <>
                        <h3>Projects</h3>
                        <input placeholder="Title" value={project.title}
                            onChange={e => setProject({ ...project, title: e.target.value })} />
                        <input placeholder="Description" value={project.desc}
                            onChange={e => setProject({ ...project, desc: e.target.value })} />
                        <input placeholder="Tech Stack" value={project.stack}
                            onChange={e => setProject({ ...project, stack: e.target.value })} />
                        <button onClick={() => addDoc(collection(db, "projects"), { ...project, createdAt: serverTimestamp() })}>
                            Add
                        </button>

                        {projects.map(p => (
                            <div key={p.id} className="admin-card">
                                <b>{p.title}</b>
                                <p>{p.desc}</p>
                                <small>{p.stack}</small>
                                <button onClick={() => deleteDoc(doc(db, "projects", p.id))}>Delete</button>
                            </div>
                        ))}
                    </>
                )}

                {active === "contacts" && (
                    <>
                        <h3>Messages</h3>
                        {contacts.map(c => (
                            <div key={c.id} className="admin-card">
                                <b>{c.fullName}</b> ({c.email})
                                <p>{c.message}</p>
                                <small>{c.createdAt?.toDate?.().toLocaleString()}</small>
                            </div>
                        ))}
                    </>
                )}

            </main>
        </div>
    );
}
