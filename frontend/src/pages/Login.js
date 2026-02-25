import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import Button from "../components/ui/Button";
import API from "../api/axios"; // ✅ Import axios instance
import { getErrorMessage } from "../utils/errorHelpers";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await API.post("/auth/login", { email, password });

      // ✅ Store JWT
      localStorage.setItem("token", response.data.access_token);

      // ✅ Store user info
      localStorage.setItem("user", JSON.stringify(response.data.user));
      localStorage.setItem("userRole", response.data.user.role);
      localStorage.setItem("userName", response.data.user.name || "");
      localStorage.setItem("userEmail", response.data.user.email || "");

      setIsLoading(false);

      navigate("/dashboard");
    } catch (error) {
      const status = error.response?.status;
      const detail = getErrorMessage(error, "Login failed");

      if (status === 403 || detail === "Account pending approval") {
        try {
          await API.post("/auth/activate-self", { email, password });
          const retry = await API.post("/auth/login", { email, password });
          localStorage.setItem("token", retry.data.access_token);
          localStorage.setItem("user", JSON.stringify(retry.data.user));
          localStorage.setItem("userRole", retry.data.user.role);
          localStorage.setItem("userName", retry.data.user.name || "");
          localStorage.setItem("userEmail", retry.data.user.email || "");
          setIsLoading(false);
          navigate("/dashboard");
          return;
        } catch (e2) {
          alert(
            e2.response?.data?.detail ||
            e2.response?.data?.message ||
            "Activation failed"
          );
        }
      } else if (status === 401) {
        alert("Invalid email or password");
      } else if (status === 404) {
        alert("User not found");
      } else {
        alert(detail);
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      {/* Left Side */}
      <div className="hidden lg:flex w-1/2 relative bg-emerald-900 overflow-hidden items-center justify-center">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1950&q=80"
            alt="Library"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/90 to-teal-900/90 mix-blend-multiply"></div>
        </div>

        <div className="relative z-10 px-20 text-white animate-fadeIn">
          <div className="mb-8 p-3 bg-white/10 w-fit rounded-xl backdrop-blur-sm animate-bounce">
            <svg
              className="w-10 h-10 text-emerald-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>

          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Welcome to <br /> Academia
          </h1>
          <p className="text-emerald-100 text-lg leading-relaxed max-w-md">
            Your gateway to world-class education management. Access your
            courses, track your progress, and connect with mentors.
          </p>
        </div>
      </div>

      {/* Right Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Sign In
            </h2>
            <p className="text-gray-500">
              Enter your credentials to access your account
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6" autoComplete="off">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all duration-200"
                placeholder="student@academia.edu"
                autoComplete="username"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all duration-200 pr-12"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <Button
              variant="primary"
              className="w-full py-3.5 text-lg"
              isLoading={isLoading}
              type="submit"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-500">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-bold text-emerald-600 hover:text-emerald-700"
            >
              Create Account
            </Link>
          </div>

          <div className="mt-4 text-center">
            <Link
              to="/"
              className="text-sm text-gray-500 hover:text-emerald-600 transition-colors inline-flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
            &copy; 2026 Academia Inc. Secure Login
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
