import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

const Admin = () => {
  const [branch, setBranch] = useState({ name: "", address: "", phone: "" });
  const [category, setCategory] = useState({ name: "" });
  const [subCategory, setSubCategory] = useState({ name: "", categoryId: "" });
  const [product, setProduct] = useState({
    name: "",
    description: "",
    priceSmall: "",
    priceMedium: "",
    priceLarge: "",
    priceSingle: "",
    branchId: "",
    categoryId: "",
    subCategoryId: "",
    image: null,
  });
  const [discount, setDiscount] = useState({ productId: "", discountPercent: "" });
  const [story, setStory] = useState({ image: null });
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [stories, setStories] = useState([]);
  const [editId, setEditId] = useState(null);
  const [activeTab, setActiveTab] = useState("products");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/admin/login");

    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const [branchesRes, categoriesRes, subCategoriesRes, productsRes, discountsRes, storiesRes] = await Promise.all([
          fetch("http://localhost:5000/branches", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("http://localhost:5000/categories", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("http://localhost:5000/subcategories", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("http://localhost:5000/products", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("http://localhost:5000/discounts", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("http://localhost:5000/stories", { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (!branchesRes.ok) throw new Error("Ошибка загрузки филиалов");
        if (!categoriesRes.ok) throw new Error("Ошибка загрузки категорий");
        if (!subCategoriesRes.ok) throw new Error("Ошибка загрузки подкатегорий");
        if (!productsRes.ok) throw new Error("Ошибка загрузки продуктов");
        if (!discountsRes.ok) throw new Error("Ошибка загрузки скидок");
        if (!storiesRes.ok) throw new Error("Ошибка загрузки историй");

        setBranches(await branchesRes.json());
        setCategories(await categoriesRes.json());
        setSubCategories(await subCategoriesRes.json());
        setProducts(await productsRes.json());
        setDiscounts(await discountsRes.json());
        setStories(await storiesRes.json());
      } catch (err) {
        console.error("Ошибка загрузки данных:", err);
      }
    };
    fetchData();
  }, [navigate]);

  const handleSubmit = async (e, url, data, setData, list, resetData, isMultipart = false) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const method = editId ? "PUT" : "POST";
    const finalUrl = editId ? `${url}/${editId}` : url;

    try {
      let response;
      if (isMultipart) {
        const formData = new FormData();
        for (const key in data) {
          if (data[key] !== null && data[key] !== "") formData.append(key, data[key]);
        }
        response = await fetch(finalUrl, {
          method,
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
      } else {
        response = await fetch(finalUrl, {
          method,
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(data),
        });
      }

      if (!response.ok) throw new Error(`Ошибка ${response.status}: ${await response.text()}`);
      const result = await response.json();

      if (editId) {
        setData(list.map((item) => (item.id === editId ? { ...item, ...result } : item)));
      } else {
        setData([...list, result]);
      }
      resetData();
      setEditId(null);
      alert(`${editId ? "Обновлено" : "Добавлено"} успешно!`);
    } catch (err) {
      console.error(err);
      alert(err.message || "Ошибка сервера");
    }
  };

  const handleDelete = async (url, id, setData, list) => {
    const token = localStorage.getItem("token");
    if (!window.confirm("Вы уверены, что хотите удалить этот элемент?")) return;

    try {
      const response = await fetch(`${url}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Ошибка ${response.status}: ${await response.text()}`);
      setData(list.filter((item) => item.id !== id));
      alert("Удалено успешно!");
    } catch (err) {
      console.error(err);
      alert(err.message || "Ошибка сервера");
    }
  };

  const handleEdit = (item, setData, resetFields) => {
    setEditId(item.id);
    setData({
      ...item,
      categoryId: item.category_id || item.categoryId,
      subCategoryId: item.sub_category_id || item.subCategoryId || "",
      branchId: item.branch_id || item.branchId,
      priceSmall: item.price_small || "",
      priceMedium: item.price_medium || "",
      priceLarge: item.price_large || "",
      priceSingle: item.price_single || "",
    });
  };

  const resetBranch = () => setBranch({ name: "", address: "", phone: "" });
  const resetCategory = () => setCategory({ name: "" });
  const resetSubCategory = () => setSubCategory({ name: "", categoryId: "" });
  const resetProduct = () =>
    setProduct({
      name: "",
      description: "",
      priceSmall: "",
      priceMedium: "",
      priceLarge: "",
      priceSingle: "",
      branchId: "",
      categoryId: "",
      subCategoryId: "",
      image: null,
    });
  const resetDiscount = () => setDiscount({ productId: "", discountPercent: "" });
  const resetStory = () => setStory({ image: null });

  const handleProductSubmit = (e) => handleSubmit(e, "http://localhost:5000/products", product, setProducts, products, resetProduct, true);

  const isPizzaCategory = () => {
    const selectedCategory = categories.find((c) => c.id === product.categoryId);
    return selectedCategory?.name.toLowerCase().includes("пицца") || false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <Header />
      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-center text-orange-700 mb-8 drop-shadow-md">Панель администратора</h1>

        {/* Tab Navigation */}
        <div className="flex justify-center space-x-4 mb-8">
          {["products", "branches", "categories", "subcategories", "discounts", "stories"].map((tab) => (
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
              {tab === "categories" && "Категории"}
              {tab === "subcategories" && "Подкатегории"}
              {tab === "discounts" && "Скидки"}
              {tab === "stories" && "Истории"}
            </button>
          ))}
        </div>

        {/* Products Section */}
        {activeTab === "products" && (
          <section className="bg-white p-6 rounded-xl shadow-lg border border-orange-100">
            <h2 className="text-2xl font-bold text-orange-700 mb-6">Управление продуктами</h2>
            <form onSubmit={handleProductSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                  <input
                    type="text"
                    value={product.name}
                    onChange={(e) => setProduct({ ...product, name: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                  <textarea
                    value={product.description}
                    onChange={(e) => setProduct({ ...product, description: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Филиал</label>
                  <select
                    value={product.branchId}
                    onChange={(e) => setProduct({ ...product, branchId: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-50"
                    required
                  >
                    <option value="">Выберите филиал</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
                  <select
                    value={product.categoryId}
                    onChange={(e) => setProduct({ ...product, categoryId: e.target.value, subCategoryId: "" })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-50"
                    required
                  >
                    <option value="">Выберите категорию</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Подкатегория</label>
                  <select
                    value={product.subCategoryId}
                    onChange={(e) => setProduct({ ...product, subCategoryId: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-50"
                    disabled={!product.categoryId}
                  >
                    <option value="">Выберите подкатегорию (опционально)</option>
                    {subCategories
                      .filter((sc) => sc.category_id === product.categoryId)
                      .map((sc) => (
                        <option key={sc.id} value={sc.id}>
                          {sc.name}
                        </option>
                      ))}
                  </select>
                </div>
                {isPizzaCategory() ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Цена (Маленькая)</label>
                      <input
                        type="number"
                        value={product.priceSmall}
                        onChange={(e) => setProduct({ ...product, priceSmall: e.target.value })}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-50"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Цена (Средняя)</label>
                      <input
                        type="number"
                        value={product.priceMedium}
                        onChange={(e) => setProduct({ ...product, priceMedium: e.target.value })}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-50"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Цена (Большая)</label>
                      <input
                        type="number"
                        value={product.priceLarge}
                        onChange={(e) => setProduct({ ...product, priceLarge: e.target.value })}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-50"
                        step="0.01"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Цена</label>
                    <input
                      type="number"
                      value={product.priceSingle}
                      onChange={(e) => setProduct({ ...product, priceSingle: e.target.value })}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-50"
                      step="0.01"
                      required={product.categoryId}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Изображение</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProduct({ ...product, image: e.target.files[0] })}
                    className="w-full p-3 border rounded-lg bg-gray-50"
                    required={!editId}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-orange-600 text-white p-3 rounded-lg hover:bg-orange-700 transition font-semibold shadow-md"
              >
                {editId ? "Обновить продукт" : "Добавить продукт"}
              </button>
            </form>

            <div className="mt-8">
              <h3 className="text-xl font-semibold text-orange-700 mb-4">Список продуктов</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((p) => (
                  <div key={p.id} className="p-4 bg-gray-50 rounded-lg shadow-md hover:shadow-lg transition">
                    <div className="flex items-center space-x-4">
                      {p.image && (
                        <img
                          src={`http://localhost:5000/uploads/${p.image}`}
                          alt={p.name}
                          className="w-16 h-16 object-cover rounded-full"
                        />
                      )}
                      <div>
                        <p className="font-bold text-gray-800">{p.name}</p>
                        <p className="text-sm text-gray-600">Филиал: {p.branch_name || "Не указан"}</p>
                        <p className="text-sm text-gray-600">Категория: {p.category_name || "Не указана"}</p>
                        <p className="text-sm text-gray-600">
                          Цены:{" "}
                          {p.is_pizza
                            ? `S: ${p.price_small || "-"}₽, M: ${p.price_medium || "-"}₽, L: ${p.price_large || "-"}₽`
                            : `${p.price_single || "-"}₽`}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(p, setProduct, resetProduct)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleDelete("http://localhost:5000/products", p.id, setProducts, products)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Branches Section */}
        {activeTab === "branches" && (
          <section className="bg-white p-6 rounded-xl shadow-lg border border-orange-100">
            <h2 className="text-2xl font-bold text-orange-700 mb-6">Управление филиалами</h2>
            <form onSubmit={(e) => handleSubmit(e, "http://localhost:5000/branches", branch, setBranches, branches, resetBranch)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                  <input
                    type="text"
                    value={branch.name}
                    onChange={(e) => setBranch({ ...branch, name: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Адрес</label>
                  <input
                    type="text"
                    value={branch.address}
                    onChange={(e) => setBranch({ ...branch, address: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                  <input
                    type="text"
                    value={branch.phone}
                    onChange={(e) => setBranch({ ...branch, phone: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-50"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-orange-600 text-white p-3 rounded-lg hover:bg-orange-700 transition font-semibold shadow-md"
              >
                {editId ? "Обновить филиал" : "Добавить филиал"}
              </button>
            </form>

            <div className="mt-8">
              <h3 className="text-xl font-semibold text-orange-700 mb-4">Список филиалов</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {branches.map((b) => (
                  <div key={b.id} className="p-4 bg-gray-50 rounded-lg shadow-md hover:shadow-lg transition">
                    <p className="font-bold text-gray-800">{b.name}</p>
                    <p className="text-sm text-gray-600">Адрес: {b.address || "Не указан"}</p>
                    <p className="text-sm text-gray-600">Телефон: {b.phone || "Не указан"}</p>
                    <div className="mt-4 flex justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(b, setBranch, resetBranch)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleDelete("http://localhost:5000/branches", b.id, setBranches, branches)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Categories Section */}
        {activeTab === "categories" && (
          <section className="bg-white p-6 rounded-xl shadow-lg border border-orange-100">
            <h2 className="text-2xl font-bold text-orange-700 mb-6">Управление категориями</h2>
            <form onSubmit={(e) => handleSubmit(e, "http://localhost:5000/categories", category, setCategories, categories, resetCategory)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                <input
                  type="text"
                  value={category.name}
                  onChange={(e) => setCategory({ ...category, name: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-50"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-orange-600 text-white p-3 rounded-lg hover:bg-orange-700 transition font-semibold shadow-md"
              >
                {editId ? "Обновить категорию" : "Добавить категорию"}
              </button>
            </form>

            <div className="mt-8">
              <h3 className="text-xl font-semibold text-orange-700 mb-4">Список категорий</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((c) => (
                  <div key={c.id} className="p-4 bg-gray-50 rounded-lg shadow-md hover:shadow-lg transition">
                    <p className="font-bold text-gray-800">{c.name}</p>
                    <div className="mt-4 flex justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(c, setCategory, resetCategory)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleDelete("http://localhost:5000/categories", c.id, setCategories, categories)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Subcategories Section */}
        {activeTab === "subcategories" && (
          <section className="bg-white p-6 rounded-xl shadow-lg border border-orange-100">
            <h2 className="text-2xl font-bold text-orange-700 mb-6">Управление подкатегориями</h2>
            <form
              onSubmit={(e) => handleSubmit(e, "http://localhost:5000/subcategories", subCategory, setSubCategories, subCategories, resetSubCategory)}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                  <input
                    type="text"
                    value={subCategory.name}
                    onChange={(e) => setSubCategory({ ...subCategory, name: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
                  <select
                    value={subCategory.categoryId}
                    onChange={(e) => setSubCategory({ ...subCategory, categoryId: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-50"
                    required
                  >
                    <option value="">Выберите категорию</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-orange-600 text-white p-3 rounded-lg hover:bg-orange-700 transition font-semibold shadow-md"
              >
                {editId ? "Обновить подкатегорию" : "Добавить подкатегорию"}
              </button>
            </form>

            <div className="mt-8">
              <h3 className="text-xl font-semibold text-orange-700 mb-4">Список подкатегорий</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subCategories.map((sc) => (
                  <div key={sc.id} className="p-4 bg-gray-50 rounded-lg shadow-md hover:shadow-lg transition">
                    <p className="font-bold text-gray-800">{sc.name}</p>
                    <p className="text-sm text-gray-600">Категория: {sc.category_name || "Не указана"}</p>
                    <div className="mt-4 flex justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(sc, setSubCategory, resetSubCategory)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleDelete("http://localhost:5000/subcategories", sc.id, setSubCategories, subCategories)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Discounts Section */}
        {activeTab === "discounts" && (
          <section className="bg-white p-6 rounded-xl shadow-lg border border-orange-100">
            <h2 className="text-2xl font-bold text-orange-700 mb-6">Управление скидками</h2>
            <form onSubmit={(e) => handleSubmit(e, "http://localhost:5000/discounts", discount, setDiscounts, discounts, resetDiscount)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Продукт</label>
                  <select
                    value={discount.productId}
                    onChange={(e) => setDiscount({ ...discount, productId: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-50"
                    required
                  >
                    <option value="">Выберите продукт</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Процент скидки</label>
                  <input
                    type="number"
                    value={discount.discountPercent}
                    onChange={(e) => setDiscount({ ...discount, discountPercent: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-50"
                    min="1"
                    max="100"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-orange-600 text-white p-3 rounded-lg hover:bg-orange-700 transition font-semibold shadow-md"
              >
                {editId ? "Обновить скидку" : "Добавить скидку"}
              </button>
            </form>

            <div className="mt-8">
              <h3 className="text-xl font-semibold text-orange-700 mb-4">Список скидок</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {discounts.map((d) => (
                  <div key={d.id} className="p-4 bg-gray-50 rounded-lg shadow-md hover:shadow-lg transition">
                    <p className="font-bold text-gray-800">{d.product_name || "Неизвестный продукт"}</p>
                    <p className="text-sm text-orange-600">Скидка: {d.discount_percent}%</p>
                    <div className="mt-4 flex justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(d, setDiscount, resetDiscount)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleDelete("http://localhost:5000/discounts", d.id, setDiscounts, discounts)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Stories Section */}
        {activeTab === "stories" && (
          <section className="bg-white p-6 rounded-xl shadow-lg border border-orange-100">
            <h2 className="text-2xl font-bold text-orange-700 mb-6">Управление историями</h2>
            <form onSubmit={(e) => handleSubmit(e, "http://localhost:5000/stories", story, setStories, stories, resetStory, true)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Изображение</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setStory({ ...story, image: e.target.files[0] })}
                  className="w-full p-3 border rounded-lg bg-gray-50"
                  required={!editId}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-orange-600 text-white p-3 rounded-lg hover:bg-orange-700 transition font-semibold shadow-md"
              >
                {editId ? "Обновить историю" : "Добавить историю"}
              </button>
            </form>

            <div className="mt-8">
              <h3 className="text-xl font-semibold text-orange-700 mb-4">Список историй</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {stories.map((s) => (
                  <div key={s.id} className="p-4 bg-gray-50 rounded-lg shadow-md hover:shadow-lg transition">
                    <img
                      src={`http://localhost:5000/uploads/${s.image}`}
                      alt="Story"
                      className="w-full h-32 object-cover rounded-lg mb-2"
                    />
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => handleEdit(s, setStory, resetStory)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleDelete("http://localhost:5000/stories", s.id, setStories, stories)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default Admin;