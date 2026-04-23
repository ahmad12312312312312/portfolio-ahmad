import { onValue, push, ref, remove, set, update } from "firebase/database";
import { rtdb } from "../firebase";

export const readRtdb = (path, callback) => {
  return onValue(ref(rtdb, path), (snap) => {
    callback(snap.exists() ? snap.val() : null);
  });
};

export const writeRtdb = (path, data) => set(ref(rtdb, path), data);

export const patchRtdb = (path, data) => update(ref(rtdb, path), data);

export const deleteRtdb = (path) => remove(ref(rtdb, path));

export const pushRtdb = async (path, data) => {
  const newRef = push(ref(rtdb, path));
  await set(newRef, data);
  return newRef.key;
};
