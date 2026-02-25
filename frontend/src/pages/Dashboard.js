import React, { useEffect, useState } from "react";
import API from "../api/axios";
import AdminDashboard from "./AdminDashboard";
import FacultyDashboard from "./FacultyDashboard";
import StudentDashboard from "./StudentDashboard";

const Dashboard = () => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const role = localStorage.getItem("userRole");

  useEffect(() => {
    if (role === 'admin' || role === 'faculty') return;

    const fetchDashboard = async () => {
      try {
        if (!role) {
          setError("User role not found. Please login again.");
          setLoading(false);
          return;
        }

        const response = await API.get(`/dashboard/${role}`);
        setData(response.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [role]);

  if (role === 'admin') {
    return <AdminDashboard />;
  }

  if (role === 'faculty') {
    return <FacultyDashboard />;
  }

  if (role === 'student') {
    return <StudentDashboard />;
  }

  if (loading) {
    return (
      <div className="p-6 text-xl font-semibold">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-600 font-semibold">
        {error}
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">
        {role?.toUpperCase()} Dashboard
      </h1>

      <div className="grid md:grid-cols-3 gap-6">
        {Object.entries(data).length === 0 ? (
          <p>No data available</p>
        ) : (
          Object.entries(data).map(([key, value]) => (
            <div
              key={key}
              className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition"
            >
              <h3 className="text-gray-500 text-sm uppercase">
                {key.replace("_", " ")}
              </h3>
              <p className="text-3xl font-bold text-emerald-600 mt-2">
                {typeof value === "object" && value !== null ? (
                  <div className="text-sm font-normal text-gray-600 mt-2 space-y-1">
                    {Object.entries(value).map(([subKey, subValue]) => (
                      <div key={subKey} className="flex justify-between">
                        <span className="font-medium">{subKey}:</span>
                        <span>{subValue}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  value
                )}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;

