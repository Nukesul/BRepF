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
  const user = JSON.parse(localStorage.getItem("user")) || null;
  const storyTimerRef = useRef(null); // Для хранения таймера историй

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const endpoints = ["branches", "products", "discounts", "stories", "categories"];
        const responses = await Promise.all(
          endpoints.map((endpoint) =>
            fetch(`https://nukesul-brepb-651f.twc1.net/${endpoint}`).then((res) => {
              if (!res.ok) throw new Error(`Ошибка загрузки ${endpoint}`);
              return res.json();
            })
          )
        );
        setBranches(responses[0]);
        setAllProducts(responses[1]);
        setDiscounts(responses[2]);
        setStories(responses[3]);
        setCategories(responses[4]);
      } catch (err) {
        setError("Не удалось загрузить данные.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      const branchProducts = allProducts.filter((product) => product.branch_id === selectedBranch);
      setFilteredProducts(branchProducts);
      setShowBranchSelection(false);
      const availableCategories = categories.filter((cat) =>
        branchProducts.some((p) => p.category_id === cat.id)
      );
      setActiveCategory(availableCategories[0]?.id || null);
    } else {
      setFilteredProducts([]);
      setShowBranchSelection(true);
      setActiveCategory(null);
    }
  }, [selectedBranch, allProducts, categories]);

  useEffect(() => {
    if (!selectedStory || !stories.length) {
      if (storyTimerRef.current) {
        clearInterval(storyTimerRef.current);
        storyTimerRef.current = null;
      }
      return;
    }

    setStoryProgress(0);
    storyTimerRef.current = setInterval(() => {
      setStoryProgress((prev) => {
        if (prev >= 100) {
          const currentIndex = stories.findIndex((s) => s.id === selectedStory.id);
          const nextIndex = (currentIndex + 1) % stories.length;
          setSelectedStory(stories[nextIndex]);
          return 0;
        }
        return prev + 2;
      });
    }, 50);

    return () => {
      if (storyTimerRef.current) {
        clearInterval(storyTimerRef.current);
        storyTimerRef.current = null;
      }
    };
  }, [selectedStory, stories]);

  const getDiscountedPrice = (price, productId) => {
    const basePrice = Number(price) || 0;
    const discount = discounts.find((d) => d.product_id === productId);
    const discountPercent = discount ? Number(discount.discount_percent) || 0 : 0;
    const promoDiscountPercent = Number(promoDiscount) || 0;

    if (promoDiscountPercent > 0 && discountPercent > 0) {
      return basePrice * (1 - discountPercent / 100) * (1 - promoDiscountPercent / 100);
    } else if (discountPercent > 0) {
      return basePrice * (1 - discountPercent / 100);
    }
    return basePrice;
  };

  const formatPrice = (price) => {
    const numPrice = Number(price) || 0;
    return numPrice.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  const scrollToCategory = (categoryId) => {
    setActiveCategory(categoryId);
    categoriesRef.current[categoryId]?.scrollIntoView({ behavior: "smooth" });
  };

  const handleNextStory = () => {
    const currentIndex = stories.findIndex((s) => s.id === selectedStory.id);
    const nextIndex = (currentIndex + 1) % stories.length;
    setSelectedStory(stories[nextIndex]);
    setStoryProgress(0);
  };

  const handlePrevStory = () => {
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

  const addToCart = (product, size = null) => {
    const price = size ? product[`price_${size}`] : product.price_single;
    const finalPrice = getDiscountedPrice(price, product.id);
    const existingItemIndex = cart.findIndex((item) => item.id === product.id && item.size === size);

    if (existingItemIndex >= 0) {
      const newCart = [...cart];
      newCart[existingItemIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, { ...product, size, quantity: 1, finalPrice }]);
    }
    setSelectedProduct(null);
    setShowCart(true);
  };

  const removeFromCart = (index) => setCart(cart.filter((_, i) => i !== index));

  const updateQuantity = (index, newQuantity) => {
    if (newQuantity < 1) return;
    const newCart = [...cart];
    newCart[index].quantity = newQuantity;
    setCart(newCart);
  };

  const calculateSubtotal = () => cart.reduce((total, item) => total + item.finalPrice * item.quantity, 0);

  const calculateTotal = () => calculateSubtotal() + (deliveryOption === "delivery" ? deliveryCost : 0);

  const applyPromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoError("Введите промокод");
      return;
    }
    try {
      const response = await fetch(`https://nukesul-brepb-651f.twc1.net/promo-codes/check/${promoCode}`);
      if (!response.ok) throw new Error("Промокод не найден");
      const promo = await response.json();
      setPromoDiscount(promo.discount_percent || 0);
      setPromoError(null);
    } catch (err) {
      setPromoDiscount(0);
      setPromoError("Неверный промокод");
    }
  };

  const handleCheckout = () => {
    if (cart.length) setShowCheckout(true);
  };

  const handlePlaceOrder = () => {
    if (cart.length) {
      alert("Заказ успешно оформлен!");
      setCart([]);
      setShowCart(false);
      setShowCheckout(false);
      setPromoCode("");
      setPromoDiscount(0);
    }
  };

  const getImageUrl = (imagePath) =>
    imagePath
      ? `https://nukesul-brepb-651f.twc1.net/product-image/${
          imagePath.includes("boody-images/") ? imagePath.split("boody-images/")[1] : imagePath
        }`
      : "https://via.placeholder.com/300";

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50 to-white font-sans antialiased">
      <Header user={user} />
      <main className="flex-grow max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-12">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="pizza-loader">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="pizza-slice"
                  style={{ transform: `rotate(${i * 60}deg) translateZ(20px)` }}
                />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <p className="text-lg text-red-600 font-medium">{error}</p>
          </div>
        ) : (
          <>
            {/* Stories */}
            {stories.length > 0 && (
              <section className="space-y-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">Акции</h2>
                <div className="flex justify-center">
                  <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide max-w-full px-2">
                    {stories.map((story) => (
                      <div
                        key={story.id}
                        className="group flex-shrink-0 cursor-pointer"
                        onClick={() => setSelectedStory(story)}
                      >
                        <img
                          src={getImageUrl(story.image)}
                          alt={story.title}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-orange-500 group-hover:scale-105 transition-transform duration-300 shadow-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                {selectedStory && (
                  <div
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 sm:p-6"
                    onClick={() => setSelectedStory(null)}
                  >
                    <div
                      className="relative w-full max-w-md sm:max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        className="absolute top-0 left-0 h-1 bg-gradient-to-r from-orange-500 to-red-500"
                        style={{ width: `${storyProgress}%`, transition: "width 0.1s linear" }}
                      />
                      <img
                        src={getImageUrl(selectedStory.image)}
                        alt={selectedStory.title}
                        className="w-full h-[50vh] sm:h-[60vh] object-contain"
                      />
                      <button
                        className="absolute top-3 right-3 bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 transition"
                        onClick={() => setSelectedStory(null)}
                      >
                        ✕
                      </button>
                      <button
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
                        onClick={handlePrevStory}
                      >
                        ❮
                      </button>
                      <button
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
                        onClick={handleNextStory}
                      >
                        ❯
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Branches */}
            {showBranchSelection && (
              <section className="space-y-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">Выберите филиал</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {branches.map((branch) => (
                    <button
                      key={branch.id}
                      onClick={() => setSelectedBranch(branch.id)}
                      className="py-3 px-6 bg-white border border-orange-200 rounded-xl text-gray-800 font-medium hover:bg-orange-100 hover:border-orange-400 transition-transform transform hover:scale-105 shadow-sm"
                    >
                      {branch.name}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Products */}
            {selectedBranch && (
              <section className="space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {branches.find((b) => b.id === selectedBranch)?.name}
                  </h2>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleBackToBranches}
                      className="flex items-center text-gray-600 hover:text-orange-600 transition"
                    >
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                      </svg>
                      Назад
                    </button>
                    <button
                      onClick={() => setShowCart(true)}
                      className="relative text-gray-600 hover:text-orange-600 transition"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      {cart.length > 0 && (
                        <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {cart.length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex space-x-2 overflow-x-auto pb-4 scrollbar-hide">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => scrollToCategory(category.id)}
                      className={`py-2 px-4 rounded-full text-sm font-medium transition-all ${
                        activeCategory === category.id
                          ? "bg-orange-500 text-white shadow-md"
                          : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>

                <div className="space-y-12">
                  {categories.map((category) => {
                    const categoryProducts = filteredProducts.filter((p) => p.category_id === category.id);
                    if (!categoryProducts.length) return null;
                    return (
                      <div key={category.id} ref={(el) => (categoriesRef.current[category.id] = el)}>
                        <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6">{category.name}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {categoryProducts.map((product) => (
                            <div
                              key={product.id}
                              className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100 hover:border-orange-300"
                              onClick={() => setSelectedProduct(product)}
                            >
                              <div className="relative overflow-hidden rounded-t-xl">
                                <img
                                  src={getImageUrl(product.image)}
                                  alt={product.name}
                                  className="w-full h-48 sm:h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                              <div className="p-4">
                                <h4 className="text-lg font-semibold text-gray-900">{product.name}</h4>
                                <p className="text-sm text-gray-600 line-clamp-2">{product.description || "Нет описания"}</p>
                                <div className="mt-3 flex items-center justify-between">
                                  <p className="text-orange-600 font-semibold">
                                    {formatPrice(getDiscountedPrice(product.price_single || 0, product.id))} Сом
                                    {discounts.some((d) => d.product_id === product.id) && product.price_single && (
                                      <span className="line-through text-gray-400 text-sm ml-2">
                                        {formatPrice(product.price_single)}
                                      </span>
                                    )}
                                  </p>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      addToCart(product);
                                    }}
                                    className="p-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Product Modal */}
            {selectedProduct && (
              <div
                className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 sm:p-6"
                onClick={() => setSelectedProduct(null)}
              >
                <div
                  className="bg-white rounded-2xl w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative">
                    <img
                      src={getImageUrl(selectedProduct.image)}
                      alt={selectedProduct.name}
                      className="w-full h-56 sm:h-64 object-cover rounded-t-2xl"
                    />
                    <button
                      className="absolute top-3 right-3 bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 transition"
                      onClick={() => setSelectedProduct(null)}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="p-6 space-y-4">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{selectedProduct.name}</h3>
                    <p className="text-gray-600 text-sm sm:text-base">{selectedProduct.description || "Нет описания"}</p>
                    {selectedProduct.price_small || selectedProduct.price_medium || selectedProduct.price_large ? (
                      <div className="space-y-3">
                        {["small", "medium", "large"].map(
                          (size) =>
                            selectedProduct[`price_${size}`] && (
                              <button
                                key={size}
                                onClick={() => addToCart(selectedProduct, size)}
                                className="w-full py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition flex justify-between items-center px-4 text-sm sm:text-base"
                              >
                                <span>
                                  {size === "small" ? "Маленькая" : size === "medium" ? "Средняя" : "Большая"}
                                </span>
                                <span>
                                  {formatPrice(getDiscountedPrice(selectedProduct[`price_${size}`] || 0, selectedProduct.id))}{" "}
                                  Сом
                                </span>
                              </button>
                            )
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <p className="text-orange-600 font-semibold text-lg">
                          {formatPrice(getDiscountedPrice(selectedProduct.price_single || 0, selectedProduct.id))} Сом
                          {discounts.some((d) => d.product_id === selectedProduct.id) && selectedProduct.price_single && (
                            <span className="line-through text-gray-400 text-sm ml-2">
                              {formatPrice(selectedProduct.price_single)}
                            </span>
                          )}
                        </p>
                        <button
                          onClick={() => addToCart(selectedProduct)}
                          className="py-2 px-6 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition font-medium"
                        >
                          В корзину
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Cart Sidebar */}
            {showCart && (
              <div
                className="fixed inset-0 bg-black/40 z-50 flex justify-center items-center p-4 sm:p-6"
                onClick={() => setShowCart(false)}
              >
                <div
                  className="bg-white rounded-2xl w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-xl transform transition-all duration-300"
                  onClick={(e) => e.stopPropagation()}
                >
                  {!showCheckout ? (
                    <>
                      <div className="flex justify-between items-center p-6 border-b">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Корзина</h2>
                        <button onClick={() => setShowCart(false)} className="text-gray-600 hover:text-gray-800">
                          ✕
                        </button>
                      </div>
                      <div className="p-6 space-y-4">
                        {cart.length === 0 ? (
                          <p className="text-center text-gray-600">Корзина пуста</p>
                        ) : (
                          cart.map((item, index) => (
                            <div key={index} className="flex items-center space-x-4 border-b pb-4">
                              <img
                                src={getImageUrl(item.image)}
                                alt={item.name}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                              <div className="flex-grow">
                                <h4 className="text-sm sm:text-base font-medium text-gray-900">{item.name}</h4>
                                {item.size && (
                                  <p className="text-xs text-gray-500">
                                    {item.size === "small" ? "Маленькая" : item.size === "medium" ? "Средняя" : "Большая"}
                                  </p>
                                )}
                                <div className="flex items-center mt-2">
                                  <button
                                    onClick={() => updateQuantity(index, item.quantity - 1)}
                                    className="w-8 h-8 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200 transition"
                                  >
                                    -
                                  </button>
                                  <span className="mx-3 text-sm font-medium">{item.quantity}</span>
                                  <button
                                    onClick={() => updateQuantity(index, item.quantity + 1)}
                                    className="w-8 h-8 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200 transition"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-orange-600 font-semibold">
                                  {formatPrice(item.finalPrice * item.quantity)} Сом
                                </p>
                                <button
                                  onClick={() => removeFromCart(index)}
                                  className="text-red-500 hover:text-red-600 text-sm"
                                >
                                  Удалить
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      {cart.length > 0 && (
                        <div className="p-6 border-t">
                          <p className="text-lg font-semibold text-gray-900">
                            Итого: {formatPrice(calculateSubtotal())} Сом
                          </p>
                          <button
                            onClick={handleCheckout}
                            className="w-full mt-4 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition font-medium"
                          >
                            Оформить заказ
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-center p-6 border-b">
                        <button onClick={() => setShowCheckout(false)} className="text-gray-600 hover:text-gray-800">
                          ← Назад
                        </button>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Оформление</h2>
                        <button onClick={() => setShowCart(false)} className="text-gray-600 hover:text-gray-800">
                          ✕
                        </button>
                      </div>
                      <div className="p-6 space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">Способ получения</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div
                              className={`p-4 border rounded-xl cursor-pointer ${
                                deliveryOption === "pickup" ? "border-orange-500 bg-orange-50" : "border-gray-200"
                              }`}
                              onClick={() => {
                                setDeliveryOption("pickup");
                                setDeliveryCost(0);
                              }}
                            >
                              <h4 className="font-medium">Самовывоз</h4>
                              <p className="text-sm text-gray-600">Бесплатно</p>
                            </div>
                            <div
                              className={`p-4 border rounded-xl cursor-pointer ${
                                deliveryOption === "delivery" ? "border-orange-500 bg-orange-50" : "border-gray-200"
                              }`}
                              onClick={() => {
                                setDeliveryOption("delivery");
                                setDeliveryCost(200);
                              }}
                            >
                              <h4 className="font-medium">Доставка</h4>
                              <p className="text-sm text-gray-600">+200 Сом</p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">Контактные данные</h3>
                          <div className="space-y-4">
                            <input
                              type="text"
                              placeholder="Ваше имя"
                              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-orange-500 focus:border-orange-500"
                            />
                            <input
                              type="tel"
                              placeholder="Телефон"
                              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-orange-500 focus:border-orange-500"
                            />
                            {deliveryOption === "delivery" && (
                              <input
                                type="text"
                                placeholder="Адрес доставки"
                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-orange-500 focus:border-orange-500"
                              />
                            )}
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">Промокод</h3>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={promoCode}
                              onChange={(e) => setPromoCode(e.target.value.toUpperCase().trim())}
                              placeholder="Введите промокод"
                              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-orange-500 focus:border-orange-500"
                            />
                            <button
                              onClick={applyPromoCode}
                              className="py-3 px-6 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition"
                            >
                              Применить
                            </button>
                          </div>
                          {promoError && <p className="text-red-500 text-sm mt-2">{promoError}</p>}
                          {promoDiscount > 0 && (
                            <p className="text-green-500 text-sm mt-2">Скидка: {promoDiscount}%</p>
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">Ваш заказ</h3>
                          {cart.map((item) => (
                            <div key={item.id} className="flex justify-between py-3 border-b">
                              <span className="text-sm text-gray-800">
                                {item.name} {item.size && `(${item.size})`} x{item.quantity}
                              </span>
                              <span className="text-sm text-orange-600 font-medium">
                                {formatPrice(item.finalPrice * item.quantity)} Сом
                              </span>
                            </div>
                          ))}
                          <div className="mt-4 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Сумма:</span>
                              <span>{formatPrice(calculateSubtotal())} Сом</span>
                            </div>
                            {deliveryOption === "delivery" && (
                              <div className="flex justify-between text-sm">
                                <span>Доставка:</span>
                                <span>{formatPrice(deliveryCost)} Сом</span>
                              </div>
                            )}
                            {promoDiscount > 0 && (
                              <div className="flex justify-between text-sm text-green-500">
                                <span>Скидка:</span>
                                <span>-{formatPrice(calculateSubtotal() * (promoDiscount / 100))} Сом</span>
                              </div>
                            )}
                            <div className="flex justify-between text-lg font-semibold">
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
                        <button
                          onClick={handlePlaceOrder}
                          className="w-full py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition font-medium"
                        >
                          Подтвердить заказ
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Home;