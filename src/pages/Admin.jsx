import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

const Home = () => {
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [stories, setStories] = useState([]);
  const [activeTab, setActiveTab] = useState("products");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          branchesRes,
          categoriesRes,
          subCategoriesRes,
          productsRes,
          storiesRes,
        ] = await Promise.all([
          fetch("https://nukesul-brepb-651f.twc1.net/branches"),
          fetch("https://nukesul-brepb-651f.twc1.net/categories"),
          fetch("https://nukesul-brepb-651f.twc1.net/subcategories"),
          fetch("https://nukesul-brepb-651f.twc1.net/products"),
          fetch("https://nukesul-brepb-651f.twc1.net/stories"),
        ]);

        if (!branchesRes.ok) throw new Error("Ошибка загрузки филиалов");
        if (!categoriesRes.ok) throw new Error("Ошибка загрузки категорий");
        if (!subCategoriesRes.ok) throw new Error("Ошибка загрузки подкатегорий");
        if (!productsRes.ok) throw new Error("Ошибка загрузки продуктов");
        if (!storiesRes.ok) throw new Error("Ошибка загрузки историй");

        setBranches(await branchesRes.json());
        setCategories(await categoriesRes.json());
        setSubCategories(await subCategoriesRes.json());
        setProducts(await productsRes.json());
        setStories(await storiesRes.json());
      } catch (err) {
        console.error("Ошибка загрузки данных:", err);
      }
    };
    fetchData();
  }, []);

  // Функция для формирования URL изображения
  const getImageUrl = (imagePath) => {
    if (!imagePath) return "https://via.placeholder.com/300";
    const fileName = imagePath.includes("boody-images/") ? imagePath.split("boody-images/")[1] : imagePath;
    return `https://nukesul-brepb-651f.twc1.net/product-image/${fileName}`;
  };

  // Обработчик ошибки загрузки изображения
  const handleImageError = (e) => {
    e.target.src = "https://via.placeholder.com/300";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <Header />
      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-center text-orange-700 mb-8 drop-shadow-md">
          Добро пожаловать!
        </h1>

        {/* Tab Navigation */}
        <div className="flex justify-center space-x-4 mb-8">
          {["products", "branches", "stories"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 ${
                activeTab === tab
                  ? "bg-orange-600 text-white shadow-lg"
                  : "bg-white text-orange-600 border border-orange-600 hover:bg-orange-100"
              }`}
            >
              {tab === "products" && "Продукты"}
              {tab === "branches" && "Филиалы"}
              {tab === "stories" && "Истории"}
            </button>
          ))}
        </div>

        {/* Products Section */}
        {activeTab === "products" && (
          <section className="bg-white p-6 rounded-xl shadow-lg border border-orange-100">
            <h2 className="text-2xl font-bold text-orange-700 mb-6">Наши продукты</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <div key={p.id} className="p-4 bg-gray-50 rounded-lg shadow-md hover:shadow-lg transition">
                  <div className="flex items-center space-x-4">
                    {p.image ? (
                      <img
                        src={getImageUrl(p.image)}
                        alt={p.name}
                        className="w-24 h-24 object-cover rounded-lg mb-2"
                        onError={handleImageError}
                      />
                    ) : (
                      <div className="w-24 h-24 flex items-center justify-center bg-gray-200 rounded-lg">
                        <span className="text-gray-500 text-sm">Нет изображения</span>
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-gray-800">{p.name}</p>
                      <p className="text-sm text-gray-600">{p.description}</p>
                      <p className="text-sm text-gray-600">Филиал: {p.branch_name || "Не указан"}</p>
                      <p className="text-sm text-orange-600">
                        Цены:{" "}
                        {p.price_small && p.price_medium && p.price_large
                          ? `S: ${p.price_small} Сом, M: ${p.price_medium} Сом, L: ${p.price_large} Сом`
                          : p.price_small && p.price_medium
                          ? `S: ${p.price_small} Сом, M: ${p.price_medium} Сом`
                          : p.price_single
                          ? `${p.price_single} Сом`
                          : "Не указаны"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Branches Section */}
        {activeTab === "branches" && (
          <section className="bg-white p-6 rounded-xl shadow-lg border border-orange-100">
            <h2 className="text-2xl font-bold text-orange-700 mb-6">Наши филиалы</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {branches.map((b) => (
                <div key={b.id} className="p-4 bg-gray-50 rounded-lg shadow-md hover:shadow-lg transition">
                  <p className="font-bold text-gray-800">{b.name}</p>
                  <p className="text-sm text-gray-600">Адрес: {b.address || "Не указан"}</p>
                  <p className="text-sm text-gray-600">Телефон: {b.phone || "Не указан"}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Stories Section */}
        {activeTab === "stories" && (
          <section className="bg-white p-6 rounded-xl shadow-lg border border-orange-100">
            <h2 className="text-2xl font-bold text-orange-700 mb-6">Истории</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {stories.map((s) => (
                <div key={s.id} className="p-4 bg-gray-50 rounded-lg shadow-md hover:shadow-lg transition">
                  {s.image ? (
                    <img
                      src={getImageUrl(s.image)}
                      alt="Story"
                      className="w-full h-32 object-cover rounded-lg mb-2"
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="w-full h-32 flex items-center justify-center bg-gray-200 rounded-lg">
                      <span className="text-gray-500 text-sm">Нет изображения</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default Home;