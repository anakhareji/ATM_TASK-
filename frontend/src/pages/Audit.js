import React from "react";
import AdminAuditLogs from "./AdminAuditLogs";

const Audit = () => {
  const role = localStorage.getItem("userRole");

  if (role === 'admin') {
    return <AdminAuditLogs />;
  }

  return (
    <div className="p-6">
      <p className="text-red-600 font-semibold">Unauthorized</p>
    </div>
  );
};

export default Audit;
