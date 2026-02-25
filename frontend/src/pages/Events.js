import React from "react";
import AdminEvents from "./AdminEvents";

const Events = () => {
  const role = localStorage.getItem("userRole");

  if (role === 'admin') {
    return <AdminEvents />;
  }

  return (
    <div className="p-6">
      <p className="text-gray-600">Events functionality for students/faculty coming soon or use NewsEvents.</p>
    </div>
  );
};

export default Events;
