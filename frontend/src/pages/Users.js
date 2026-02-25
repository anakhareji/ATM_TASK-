import React from "react";
import AdminUsers from "./AdminUsers";

const Users = () => {
  const role = localStorage.getItem("userRole");

  if (role === 'admin') {
    return <AdminUsers />;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
      <p className="text-red-600 font-semibold">Unauthorized</p>
    </div>
  );
};

export default Users;
