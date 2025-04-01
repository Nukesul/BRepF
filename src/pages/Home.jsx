import { useEffect, useState, useRef } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

const Home = () => {
  const [branches, setBranches] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [stories, setStories] = useState([]);
  const [selectedStory, setSelectedStory] = useState(null);
  const [storyProgress, setStoryProgress] = useState(0);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showBranchSelection, setShowBranchSelection] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [deliveryOption, setDeliveryOption] = useState("pickup");
  const [deliveryCost, setDeliveryCost] = useState(0);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState(null);
  const categoriesRef = useRef({});
  const user = JSON.parse(localStorage.getItem("user")) || { id: "default-user" }; // Добавляем userId

  const API_URL = "http://localhost:3001"; // URL вашего сервера

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_URL}/api/data`);
        if (!response.ok) throw new Error("Ошибка загрузки данных");
        const data = await response.json();

        setBranches(data.branches);
        setAllProducts(data.products);
        setDiscounts(data.discounts);
        setStories(data.stories);
        setCategories(data.categories);
      } catch (err) {
        console.error("Ошибка загрузки данных:", err);
        setError("Не удалось загрузить данные. Проверьте подключение или попробуйте позже.");
      } finally {
        setLoading(false);
      }
    };

    const fetchCart = async () => {
      try {
        const response = await fetch(`${API_URL}/api/cart/${user.id}`);
        if (!response.ok) throw new Error("Ошибка загрузки корзины");
        const cartData = await response.json();
        setCart(cartData);
      } catch (err) {
        console.error("Ошибка загрузки корзины:", err);
      }
    };

    fetchData();
    fetchCart();
  }, [user.id]);

  useEffect(() => {
    if (selectedBranch) {
      const branchProducts = allProducts.filter((product) => product.branch_id === selectedBranch);
      setFilteredProducts(branchProducts);
      setShowBranchSelection(false);

      if (categories.length > 0 && branchProducts.length > 0) {
        const availableCategories = categories.filter((cat) =>
          branchProducts.some((p) => p.category_id === cat.id)
        );
        if (availableCategories.length > 0) {
          setActiveCategory(availableCategories[0].id);
        } else {
          setActiveCategory(null);
        }
      }
    } else {
      setFilteredProducts([]);
      setShowBranchSelection(true);
      setActiveCategory(null);
    }
  }, [selectedBranch, allProducts, categories]);

  useEffect(() => {
    if (!selectedStory || stories.length === 0) return;

    setStoryProgress(0);
    const timer = setInterval(() => {
      setStoryProgress((prev) => {
        if (prev >= 100) {
          const currentIndex = stories.findIndex((s) => s.id === selectedStory.id);
          const nextIndex = (currentIndex + 1) % stories.length;
          setSelectedStory(stories[nextIndex]);
          return 0;
        }
        return prev + 1;
      });
    }, 50);

    return () => clearInterval(timer);
  }, [selectedStory, stories]);

  const getDiscountedPrice = (price, productId) => {
    if (!price || isNaN(price)) return 0;
    const discount = discounts.find((d) => d.product_id === productId);
    const basePrice = Number(price);
    const baseDiscount = discount ? basePrice * (1 - discount.discount_percent / 100) : basePrice;
    return promoDiscount > 0 ? baseDiscount * (1 - promoDiscount / 100) : baseDiscount;
  };

  const formatPrice = (price) => {
    if (!price || isNaN(price)) return "0.00";
    return Number(price).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  const scrollToCategory = (categoryId) => {
    setActiveCategory(categoryId);
    const element = categoriesRef.current[categoryId];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleNextStory = () => {
    if (!selectedStory || stories.length === 0) return;
    const currentIndex = stories.findIndex((s) => s.id === selectedStory.id);
    const nextIndex = (currentIndex + 1) % stories.length;
    setSelectedStory(stories[nextIndex]);
    setStoryProgress(0);
  };

  const handlePrevStory = () => {
    if (!selectedStory || stories.length === 0) return;
    const currentIndex = stories.findIndex((s) => s.id === selectedStory.id);
    const prevIndex = (currentIndex - 1 + stories.length) % stories.length;
    setSelectedStory(stories[prevIndex]);
    setStoryProgress(0);
  };

  const handleBackToBranches = () => {
    setSelectedBranch(null);
    setShowBranchSelection(true);
    setActiveCategory(null);
    setShowCart(false);
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
  };

  const addToCart = async (product, size = null) => {
    if (!product) return;
    try {
      const response = await fetch(`${API_URL}/api/cart/${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, size, discounts, promoDiscount }),
      });
      if (!response.ok) throw new Error("Ошибка добавления в корзину");
      const updatedCart = await response.json();
      setCart(updatedCart);
      setSelectedProduct(null);
      setShowCart(true);
    } catch (err) {
      console.error("Ошибка добавления в корзину:", err);
    }
  };

  const removeFromCart = async (index) => {
    if (index < 0 || index >= cart.length) return;
    try {
      const response = await fetch(`${API_URL}/api/cart/${user.id}/${index}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Ошибка удаления из корзины");
      const updatedCart = await response.json();
      setCart(updatedCart);
    } catch (err) {
      console.error("Ошибка удаления из корзины:", err);
    }
  };

  const updateQuantity = async (index, newQuantity) => {
    if (newQuantity < 1 || index < 0 || index >= cart.length) return;
    try {
      const response = await fetch(`${API_URL}/api/cart/${user.id}/${index}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQuantity }),
      });
      if (!response.ok) throw new Error("Ошибка обновления количества");
      const updatedCart = await response.json();
      setCart(updatedCart);
    } catch (err) {
      console.error("Ошибка обновления количества:", err);
    }
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + (item.finalPrice || 0) * (item.quantity || 1), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    return subtotal + (deliveryOption === "delivery" ? deliveryCost : 0);
  };

  const applyPromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoError("Введите промокод");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/promo-codes/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promoCode }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }
      const promo = await response.json();
      setPromoDiscount(promo.discount_percent || 0);
      setPromoError(null);
      alert(`Промокод "${promo.code}" применен! Скидка ${promo.discount_percent}%`);
    } catch (err) {
      setPromoDiscount(0);
      setPromoError(err.message || "Неверный или неактивный промокод");
      console.error("Ошибка применения промокода:", err);
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setDeliveryCost(deliveryOption === "delivery" ? 200 : 0);
    setShowCheckout(true);
  };

  const handleBackToCart = () => {
    setShowCheckout(false);
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    try {
      const response = await fetch(`${API_URL}/api/orders/${user.id}`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Ошибка оформления заказа");
      const result = await response.json();
      alert(result.message);
      setCart([]);
      setShowCart(false);
      setShowCheckout(false);
      setPromoCode("");
      setPromoDiscount(0);
      setPromoError(null);
    } catch (err) {
      console.error("Ошибка оформления заказа:", err);
    }
  };

  const getAvailableCategories = () => {
    if (!selectedBranch || filteredProducts.length === 0) return [];
    return categories.filter((category) =>
      filteredProducts.some((product) => product.category_id === category.id)
    );
  };

  const hasMultiplePrices = (product) => {
    return Boolean(product?.price_small || product?.price_medium || product?.price_large);
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "https://via.placeholder.com/300";
    const fileName = imagePath.includes("boody-images/") ? imagePath.split("boody-images/")[1] : imagePath;
    return `https://nukesul-brepb-651f.twc1.net/product-image/${fileName}`;
  };

  const handleImageError = (e) => {
    console.error(`Ошибка загрузки изображения: ${e.target.src}`);
    e.target.src = "https://via.placeholder.com/300";
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50 to-white">
      <Header user={user} />
      <main className="flex-grow max-w-6xl mx-auto p-6 space-y-12">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600 animate-pulse">Загрузка данных...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <p className="text-xl text-red-600">{error}</p>
          </div>
        ) : (
          <>
            <section id="stories" className="mb-12">
              <h2 className="text-4xl font-extrabold text-gray-800 mb-6 text-center">Акции и новости</h2>
              <div className="flex justify-center">
                <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide max-w-full">
                  {stories.map((story) => (
                    <div
                      key={story.id}
                      className="flex flex-col items-center cursor-pointer flex-shrink-0"
                      onClick={() => setSelectedStory(story)}
                    >
                      <img
                        src={getImageUrl(story.image)}
                        alt={story.title || "Акция"}
                        className="w-20 h-20 rounded-full object-cover hover:scale-110 transition border-4 border-orange-500"
                        onError={handleImageError}
                      />
                      <span className="mt-2 text-sm font-medium text-gray-700">Акция</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedStory && (
                <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
                  <div
                    className="relative w-full max-w-md h-[80vh] bg-white rounded-lg overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div
                      className="absolute top-0 left-0 h-1 bg-orange-500"
                      style={{ width: `${storyProgress}%`, transition: "width 0.05s linear" }}
                    />
                    <img
                      src={getImageUrl(selectedStory.image)}
                      alt={selectedStory.title || "Выбранная акция"}
                      className="w-full h-full object-contain"
                      onError={handleImageError}
                    />
                    <button
                      className="absolute top-2 right-2 bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 transition"
                      onClick={() => setSelectedStory(null)}
                    >
                      ✕
                    </button>
                    <button
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition"
                      onClick={handlePrevStory}
                    >
                      ❮
                    </button>
                    <button
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition"
                      onClick={handleNextStory}
                    >
                      ❯
                    </button>
                  </div>
                </div>
              )}
            </section>

            {showBranchSelection && (
              <section id="branches" className="mb-12">
                <h2 className="text-4xl font-extrabold text-gray-800 mb-6 text-center">Выберите филиал</h2>
                <div className="flex flex-wrap gap-4 justify-center mb-6">
                  {branches.length > 0 ? (
                    branches.map((branch) => (
                      <button
                        key={branch.id}
                        onClick={() => setSelectedBranch(branch.id)}
                        className="px-6 py-3 rounded-xl bg-white text-orange-600 border-2 border-orange-600 transition-all hover:shadow-lg hover:bg-orange-50 hover:scale-105"
                      >
                        {branch.name}
                      </button>
                    ))
                  ) : (
                    <p className="text-xl text-gray-600">Филиалы отсутствуют</p>
                  )}
                </div>
              </section>
            )}

            {selectedBranch && (
              <section id="products" className="mb-12">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-4xl font-extrabold text-gray-800">
                    Меню в {branches.find((b) => b.id === selectedBranch)?.name || "Выбранный филиал"}
                  </h2>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setShowCart(!showCart)}
                      className="relative flex items-center text-orange-600 hover:text-orange-800 transition"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      {cart.length > 0 && (
                        <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                          {cart.length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={handleBackToBranches}
                      className="flex items-center text-orange-600 hover:text-orange-800 transition"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 19l-7-7m0 0l7-7m-7 7h18"
                        />
                      </svg>
                      Назад
                    </button>
                  </div>
                </div>

                <div className="flex overflow-x-auto pb-4 mb-6 scrollbar-hide">
                  <div className="flex space-x-2">
                    {getAvailableCategories().map((category) => (
                      <button
                        key={category.id}
                        onClick={() => scrollToCategory(category.id)}
                        className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
                          activeCategory === category.id
                            ? "bg-orange-500 text-white"
                            : "bg-white text-gray-800 border border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredProducts.length > 0 ? (
                  <div className="space-y-12">
                    {getAvailableCategories().map((category) => {
                      const categoryProducts = filteredProducts.filter((p) => p.category_id === category.id);
                      if (categoryProducts.length === 0) return null;

                      return (
                        <div
                          key={category.id}
                          ref={(el) => (categoriesRef.current[category.id] = el)}
                          className="scroll-mt-24"
                        >
                          <div className="flex items-center mb-6">
                            <div className="flex-grow h-px bg-orange-200" />
                            <h3 className="mx-4 text-2xl font-bold text-gray-800 text-center">{category.name}</h3>
                            <div className="flex-grow h-px bg-orange-200" />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {categoryProducts.map((product) => (
                              <div
                                key={product.id}
                                className="p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition transform hover:scale-[1.02] border-2 border-transparent hover:border-orange-400 relative overflow-hidden"
                                onClick={() => handleProductClick(product)}
                              >
                                <div className="absolute inset-0 bg-yellow-100 opacity-0 hover:opacity-20 transition-opacity duration-300" />
                                <img
                                  src={getImageUrl(product.image)}
                                  alt={product.name || "Продукт"}
                                  className="w-full h-48 object-cover rounded-t-lg"
                                  onError={handleImageError}
                                />
                                <div className="mt-4">
                                  <h3 className="text-xl font-bold text-gray-800">{product.name}</h3>
                                  <p className="text-gray-600 line-clamp-2">{product.description || "Нет описания"}</p>
                                  {hasMultiplePrices(product) ? (
                                    <div className="mt-2 space-y-1">
                                      {product.price_small && (
                                        <p className="text-orange-600 font-semibold">
                                          Маленькая: {formatPrice(getDiscountedPrice(product.price_small, product.id))} Сом
                                          {discounts.some((d) => d.product_id === product.id) && (
                                            <span className="line-through text-gray-500 ml-2">
                                              {formatPrice(product.price_small)} Сом
                                            </span>
                                          )}
                                        </p>
                                      )}
                                      {product.price_medium && (
                                        <p className="text-orange-600 font-semibold">
                                          Средняя: {formatPrice(getDiscountedPrice(product.price_medium, product.id))} Сом
                                          {discounts.some((d) => d.product_id === product.id) && (
                                            <span className="line-through text-gray-500 ml-2">
                                              {formatPrice(product.price_medium)} Сом
                                            </span>
                                          )}
                                        </p>
                                      )}
                                      {product.price_large && (
                                        <p className="text-orange-600 font-semibold">
                                          Большая: {formatPrice(getDiscountedPrice(product.price_large, product.id))} Сом
                                          {discounts.some((d) => d.product_id === product.id) && (
                                            <span className="line-through text-gray-500 ml-2">
                                              {formatPrice(product.price_large)} Сом
                                            </span>
                                          )}
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-orange-600 font-semibold mt-2">
                                      {formatPrice(getDiscountedPrice(product.price_single, product.id))} Сом
                                      {discounts.some((d) => d.product_id === product.id) && (
                                        <span className="line-through text-gray-500 ml-2">
                                          {formatPrice(product.price_single)} Сом
                                        </span>
                                      )}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-xl shadow-md">
                    <p className="text-xl text-gray-600">В этом филиале пока нет продуктов</p>
                  </div>
                )}
              </section>
            )}

            {selectedProduct && (
              <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
                <div
                  className="relative bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="absolute top-4 right-4 bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 transition z-10"
                    onClick={() => setSelectedProduct(null)}
                  >
                    ✕
                  </button>

                  <div className="p-6">
                    <img
                      src={getImageUrl(selectedProduct.image)}
                      alt={selectedProduct.name || "Продукт"}
                      className="w-full h-64 object-cover rounded-lg mb-4"
                      onError={handleImageError}
                    />
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{selectedProduct.name}</h3>
                    <p className="text-gray-600 mb-4">{selectedProduct.description || "Описание отсутствует"}</p>

                    {hasMultiplePrices(selectedProduct) ? (
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-800 mb-3">Выберите размер:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {["small", "medium", "large"].map((size) =>
                            selectedProduct[`price_${size}`] ? (
                              <button
                                key={size}
                                onClick={() => addToCart(selectedProduct, size)}
                                className="p-3 border-2 border-orange-400 rounded-lg hover:bg-orange-50 transition flex flex-col items-center"
                              >
                                <span className="capitalize font-medium">
                                  {size === "small" ? "Маленькая" : size === "medium" ? "Средняя" : "Большая"}
                                </span>
                                <span className="text-orange-600 font-bold">
                                  {formatPrice(getDiscountedPrice(selectedProduct[`price_${size}`], selectedProduct.id))}{" "}
                                  Сом
                                </span>
                                {discounts.some((d) => d.product_id === selectedProduct.id) && (
                                  <span className="line-through text-gray-500 text-sm">
                                    {formatPrice(selectedProduct[`price_${size}`])} Сом
                                  </span>
                                )}
                              </button>
                            ) : null
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mb-6">
                        <div className="flex justify-between items-center">
                          <span className="text-xl font-bold text-orange-600">
                            {formatPrice(getDiscountedPrice(selectedProduct.price_single, selectedProduct.id))} Сом
                          </span>
                          {discounts.some((d) => d.product_id === selectedProduct.id) && (
                            <span className="line-through text-gray-500">
                              {formatPrice(selectedProduct.price_single)} Сом
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => addToCart(selectedProduct)}
                          className="w-full mt-4 bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition font-bold text-lg"
                        >
                          Добавить в корзину
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {showCart && cart.length > 0 && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowCart(false)} />
            )}
            <div
              className={`fixed top-0 right-0 h-full bg-white shadow-xl z-50 w-full max-w-md transform transition-transform duration-300 ease-in-out ${
                showCart && cart.length > 0 ? "translate-x-0" : "translate-x-full"
              }`}
            >
              <div className="p-6 h-full flex flex-col">
                {!showCheckout ? (
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-800">Ваш заказ</h2>
                      <button onClick={() => setShowCart(false)} className="text-gray-500 hover:text-gray-700">
                        ✕
                      </button>
                    </div>

                    <div className="flex-grow overflow-y-auto">
                      {cart.map((item, index) => (
                        <div key={`${item.id}-${item.size || "single"}`} className="flex items-start py-4 border-b">
                          <img
                            src={getImageUrl(item.image)}
                            alt={item.name || "Продукт"}
                            className="w-16 h-16 object-cover rounded-lg mr-4"
                            onError={handleImageError}
                          />
                          <div className="flex-grow">
                            <div className="flex justify-between">
                              <div>
                                <h4 className="font-medium">{item.name}</h4>
                                {item.size && (
                                  <p className="text-sm text-gray-500">
                                    {item.size === "small" ? "Маленькая" : item.size === "medium" ? "Средняя" : "Большая"}
                                  </p>
                                )}
                              </div>
                              <p className="text-orange-600 font-bold">
                                {formatPrice(item.finalPrice * item.quantity)} Сом
                              </p>
                            </div>
                            <div className="flex items-center mt-2">
                              <button
                                onClick={() => updateQuantity(index, item.quantity - 1)}
                                className="w-8 h-8 flex items-center justify-center border rounded-lg text-gray-700 hover:bg-gray-100"
                              >
                                -
                              </button>
                              <span className="mx-2 w-8 text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(index, item.quantity + 1)}
                                className="w-8 h-8 flex items-center justify-center border rounded-lg text-gray-700 hover:bg-gray-100"
                              >
                                +
                              </button>
                              <button
                                onClick={() => removeFromCart(index)}
                                className="text-red-500 hover:text-red-700 ml-auto"
                              >
                                Удалить
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4 space-y-4">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Итого:</span>
                        <span className="text-orange-600">{formatPrice(calculateSubtotal())} Сом</span>
                      </div>
                      <button
                        onClick={handleCheckout}
                        className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition font-bold text-lg disabled:bg-gray-400"
                        disabled={cart.length === 0}
                      >
                        Оформить заказ
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <button onClick={handleBackToCart} className="text-gray-500 hover:text-gray-700">
                        ← Назад
                      </button>
                      <h2 className="text-2xl font-bold text-gray-800">Оформление заказа</h2>
                      <button onClick={() => setShowCart(false)} className="text-gray-500 hover:text-gray-700">
                        ✕
                      </button>
                    </div>

                    <div className="flex-grow overflow-y-auto space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Способ получения</h3>
                        <div className="space-y-3">
                          <div
                            className={`p-4 border-2 rounded-lg cursor-pointer ${
                              deliveryOption === "pickup" ? "border-orange-500 bg-orange-50" : "border-gray-300"
                            }`}
                            onClick={() => {
                              setDeliveryOption("pickup");
                              setDeliveryCost(0);
                            }}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-bold">Самовывоз</h4>
                                <p className="text-sm text-gray-600">Заберёте сами из ресторана</p>
                              </div>
                              {deliveryOption === "pickup" && (
                                <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 text-white"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </div>
                          <div
                            className={`p-4 border-2 rounded-lg cursor-pointer ${
                              deliveryOption === "delivery" ? "border-orange-500 bg-orange-50" : "border-gray-300"
                            }`}
                            onClick={() => {
                              setDeliveryOption("delivery");
                              setDeliveryCost(200);
                            }}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-bold">Доставка</h4>
                                <p className="text-sm text-gray-600">Доставим по указанному адресу</p>
                                <p className="text-sm text-orange-600 mt-1">+200 Сом</p>
                              </div>
                              {deliveryOption === "delivery" && (
                                <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 text-white"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-3">Контактные данные</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                            <input
                              type="text"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                              placeholder="Ваше имя"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                            <input
                              type="tel"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                              placeholder="+996 XXX XXX XXX"
                              required
                            />
                          </div>
                          {deliveryOption === "delivery" && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Адрес доставки</label>
                              <input
                                type="text"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                                placeholder="Улица, дом, квартира"
                                required
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-3">Промокод</h3>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value.toUpperCase().trim())}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                            placeholder="Введите промокод"
                          />
                          <button
                            onClick={applyPromoCode}
                            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                          >
                            Применить
                          </button>
                        </div>
                        {promoError && <p className="text-red-500 text-sm mt-2">{promoError}</p>}
                        {promoDiscount > 0 && (
                          <p className="text-green-500 text-sm mt-2">
                            Промокод применен! Скидка: {promoDiscount}%
                          </p>
                        )}
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-3">Ваш заказ</h3>
                        <div className="space-y-3">
                          {cart.map((item, index) => (
                            <div
                              key={`${item.id}-${item.size || "single"}`}
                              className="flex justify-between items-center py-2 border-b"
                            >
                              <div>
                                <p className="font-medium">{item.name}</p>
                                {item.size && (
                                  <p className="text-sm text-gray-500">
                                    {item.size === "small" ? "Маленькая" : item.size === "medium" ? "Средняя" : "Большая"}
                                  </p>
                                )}
                                <p className="text-sm text-gray-600">x{item.quantity}</p>
                              </div>
                              <p className="text-orange-600 font-bold">
                                {formatPrice(item.finalPrice * item.quantity)} Сом
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Сумма заказа:</span>
                          <span>{formatPrice(calculateSubtotal())} Сом</span>
                        </div>
                        {deliveryOption === "delivery" && (
                          <div className="flex justify-between">
                            <span>Доставка:</span>
                            <span>{formatPrice(deliveryCost)} Сом</span>
                          </div>
                        )}
                        {promoDiscount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Скидка по промокоду:</span>
                            <span>-{formatPrice(calculateSubtotal() * (promoDiscount / 100))} Сом</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-lg">
                          <span>Итого:</span>
                          <span className="text-orange-600">
                            {formatPrice(
                              calculateTotal() - (promoDiscount > 0 ? calculateSubtotal() * (promoDiscount / 100) : 0)
                            )}{" "}
                            Сом
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <button
                        onClick={handlePlaceOrder}
                        className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition font-bold text-lg disabled:bg-gray-400"
                        disabled={cart.length === 0}
                      >
                        Подтвердить заказ
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Home;