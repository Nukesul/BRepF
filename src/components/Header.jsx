import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Header = ({ user }) => {
  const [currentUser, setCurrentUser] = useState(user);
  const navigate = useNavigate();

  useEffect(() => {
    setCurrentUser(JSON.parse(localStorage.getItem("user")) || user);
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setCurrentUser(null);
    navigate("/");
  };

  return (
    <header className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 flex justify-between items-center shadow-lg sticky top-0 z-50">
      <div className="text-2xl font-extrabold flex items-center">
        <span className="text-3xl mr-2 animate-spin">🍕</span> Booday Pizza
      </div>
      <nav className="hidden md:flex space-x-8">
        <a href="#branches" className="hover:underline text-lg font-semibold transition">Филиалы</a>
        <a href="#products" className="hover:underline text-lg font-semibold transition">Продукты</a>
        <a href="#stories" className="hover:underline text-lg font-semibold transition">Истории</a>
      </nav>
      <div className="flex items-center space-x-4">
        {currentUser ? (
          <>
            <span className="text-lg font-semibold">Привет, {currentUser.name}!</span>
            <button
              onClick={handleLogout}
              className="bg-orange-700 px-4 py-2 rounded-lg hover:bg-orange-800 transition font-semibold"
            >
              Выйти
            </button>
          </>
        ) : (
          <div className="space-x-2">
            <a href="/login" className="bg-orange-700 px-4 py-2 rounded-lg hover:bg-orange-800 transition font-semibold">
              Вход
            </a>
            <a href="/register" className="bg-orange-700 px-4 py-2 rounded-lg hover:bg-orange-800 transition font-semibold">
              Регистрация
            </a>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;