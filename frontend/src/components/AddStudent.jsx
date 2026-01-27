import React, { useState } from "react";

export default function AddStudent({ onAdd, onCancel }) {
  const [name, setName] = useState("");
  const [wallet, setWallet] = useState("");
  const [course, setCourse] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    onAdd({
      id: Date.now(),
      name,
      wallet,
      course,
    });

    setName("");
    setWallet("");
    setCourse("");
  };

  return (
    <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Add Student</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          required
          placeholder="Student Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-white"
        />

        <input
          required
          placeholder="Student Wallet / ID"
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-white"
        />

        <input
          required
          placeholder="Course ID (e.g. CS101)"
          value={course}
          onChange={(e) => setCourse(e.target.value)}
          className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-white"
        />

        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 bg-slate-700 text-white rounded-lg"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
          >
            Add Student
          </button>
        </div>
      </form>
    </div>
  );
}
