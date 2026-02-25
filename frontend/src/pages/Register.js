import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, UserPlus, GraduationCap, BookOpen } from "lucide-react";
import Button from "../components/ui/Button";
import API from "../api/axios";
import { getErrorMessage } from "../utils/errorHelpers";

const Register = () => {
    const [role, setRole] = useState("student"); // student or faculty
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setIsLoading(true);

        try {
            const endpoint = role === "student" ? "/auth/register/student" : "/auth/register/faculty";
            await API.post(endpoint, {
                name: formData.name,
                email: formData.email,
                password: formData.password
            });

            // Success - redirect to login with success message
            alert("Registration successful! Your account is pending admin approval. You'll be able to login once approved.");
            navigate("/login");
        } catch (err) {
            setIsLoading(false);
            setError(getErrorMessage(err, "Registration failed. Please try again."));
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="min-h-screen flex bg-white font-sans">
            {/* Left Side */}
            <div className="hidden lg:flex w-1/2 relative bg-teal-900 overflow-hidden items-center justify-center">
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1950&q=80"
                        alt="Students"
                        className="w-full h-full object-cover opacity-30"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-900/90 to-emerald-900/90 mix-blend-multiply"></div>
                </div>

                <div className="relative z-10 px-20 text-white animate-fadeIn">
                    <div className="mb-8 p-3 bg-white/10 w-fit rounded-xl backdrop-blur-sm">
                        <GraduationCap className="w-10 h-10 text-emerald-300" />
                    </div>

                    <h1 className="text-5xl font-bold mb-6 leading-tight">
                        Join Our <br /> Academic Community
                    </h1>
                    <p className="text-emerald-100 text-lg leading-relaxed max-w-md">
                        Register as a student or faculty member to access our comprehensive
                        academic task management system. Start your journey today!
                    </p>
                </div>
            </div>

            {/* Right Side */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
                <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            Create Account
                        </h2>
                        <p className="text-gray-500">
                            Register to get started with Academia
                        </p>
                    </div>

                    {/* Role Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            I am a:
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setRole("student")}
                                className={`p-4 rounded-xl border-2 transition-all duration-200 ${role === "student"
                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                    : "border-gray-200 bg-white text-gray-600 hover:border-emerald-200"
                                    }`}
                            >
                                <BookOpen className="w-6 h-6 mx-auto mb-2" />
                                <span className="font-semibold text-sm">Student</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole("faculty")}
                                className={`p-4 rounded-xl border-2 transition-all duration-200 ${role === "faculty"
                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                    : "border-gray-200 bg-white text-gray-600 hover:border-emerald-200"
                                    }`}
                            >
                                <GraduationCap className="w-6 h-6 mx-auto mb-2" />
                                <span className="font-semibold text-sm">Faculty</span>
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Full Name
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all duration-200"
                                placeholder="John Doe"
                                required
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                {role === "student" ? "Student Email" : "Faculty Email"}
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all duration-200"
                                placeholder={role === "student" ? "student@academia.edu" : "faculty@academia.edu"}
                                autoComplete="username"
                                required
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
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

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all duration-200 pr-12"
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors p-1"
                                >
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <Button
                            variant="primary"
                            className="w-full py-3.5 text-lg mt-6"
                            isLoading={isLoading}
                            type="submit"
                        >
                            <UserPlus className="w-5 h-5 inline mr-2" />
                            Create Account
                        </Button>
                    </form>

                    <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <p className="text-xs text-amber-800 text-center">
                            <strong>Note:</strong> Your account will be pending approval by an administrator.
                            You'll receive access once approved.
                        </p>
                    </div>

                    <div className="mt-6 text-center text-sm text-gray-500">
                        Already have an account?{" "}
                        <Link
                            to="/login"
                            className="font-bold text-emerald-600 hover:text-emerald-700"
                        >
                            Sign In
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
                        &copy; 2026 Academia Inc. Secure Registration
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
