import React, { useState } from "react";

const TEACHER_API_BASE_URL = "http://localhost:4000/api/v1/teacher";

export default function AddTeacher({ onAdd, onCancel }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [qualification, setQualification] = useState("");
  const [experience, setExperience] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      const response = await fetch(`${TEACHER_API_BASE_URL}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userData?.token}`
        },
        body: JSON.stringify({
          fullName,
          email,
          department,
          qualification,
          experience: parseInt(experience) || 0,
          specialization,
          phone
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onAdd(data.data);
        setFullName("");
        setEmail("");
        setDepartment("");
        setQualification("");
        setExperience("");
        setSpecialization("");
        setPhone("");
      } else {
        setError(data.message || "Failed to add teacher");
      }
    } catch (err) {
      setError(err.message || "Error adding teacher");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Add Teacher</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          required
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-white"
        />

        <input
          required
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-white"
        />

        <input
          required
          placeholder="Department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-white"
        />

        <input
          placeholder="Qualification (e.g., B.Tech, M.Tech)"
          value={qualification}
          onChange={(e) => setQualification(e.target.value)}
          className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-white"
        />

        <input
          type="number"
          placeholder="Experience (years)"
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-white"
        />

        <input
          placeholder="Specialization"
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
          className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-white"
        />

        <input
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
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
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Teacher"}
          </button>
        </div>
      </form>
    </div>
  );
}
