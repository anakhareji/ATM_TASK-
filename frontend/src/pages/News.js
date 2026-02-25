import React from "react";
import AdminNews from "./AdminNews";

const News = () => {
  const role = localStorage.getItem("userRole");

  if (role === 'admin') {
    return <AdminNews />;
  }

  // Fallback or Public view if needed, but for now just redirect/Unauthorized if not admin
  // Actually, students might need to see news too.
  // In ATM, usually News is public for everyone.
  // Let's see if there is a StudentNews... 

  return (
    <div className="p-6">
      <p className="text-gray-600">News functionality for students/faculty coming soon or use NewsEvents.</p>
    </div>
  );
};

export default News;
