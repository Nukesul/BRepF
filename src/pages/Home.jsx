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
    if (!selectedStory || !stories.length) return;
    setStoryProgress(0);
    const timer = setInterval(() => {
      setStoryProgress((prev) => {
        if (prev >= 100) {
          const currentIndex = stories.findIndex((s) => s.id === selectedStory.id);
          setSelectedStory(stories[(currentIndex + 1) % stories.length]);
          return 0;
        }
        return prev + 2;
      });
    }, 50);
    return () => clearInterval(timer);
  }, [selectedStory, stories]);

  const getDiscountedPrice = (price, productId) => {
    const discount = discounts.find((d) => d.product_id === productId);
    const basePrice = Number(price) || 0;
    return promoDiscount > 0 && discount
      ? basePrice * (1 - discount.discount_percent / 100) * (1 - promoDiscount / 100)
      : discount
      ? basePrice * (1 - discount.discount_percent / 100)
      : basePrice;
  };

  const formatPrice = (price) => Number(price || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  const scrollToCategory = (categoryId) => {
    setActiveCategory(categoryId);
    categoriesRef.current[categoryId]?.scrollIntoView({ behavior: "smooth" });
  };

  const handleNextStory = () => {
    const currentIndex = stories.findIndex((s) => s.id === selectedStory.id);
    setSelectedStory(stories[(currentIndex + 1) % stories.length]);
    setStoryProgress(0);
  };

  const handlePrevStory = () => {
    const currentIndex = stories.findIndex((s) => s.id === selectedStory.id);
    setSelectedStory(stories[(currentIndex - 1 + stories.length) % stories.length]);
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
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <Header user={user} />
      <main className="flex-grow max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
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
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-lg text-red-500">{error}</p>
          </div>
        ) : (
          <>
            {/* Stories */}
            {stories.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-3xl font-bold text-gray-800 text-center">Акции</h2>
                <div className="flex overflow-x-auto space-x-4 pb-2 scrollbar-hide">
                  {stories.map((story) => (
                    <div
                      key={story.id}
                      className="flex-shrink-0 cursor-pointer group"
                      onClick={() => setSelectedStory(story)}
                    >
                      <img
                        src={getImageUrl(story.image)}
                        alt={story.title}
                        className="w-16 h-16 rounded-full object-cover border-2 border-orange-400 group-hover:scale-105 transition"
                      />
                    </div>
                  ))}
                </div>
                {selectedStory && (
                  <div
                    className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedStory(null)}
                  >
                    <div className="relative w-full max-w-lg rounded-xl overflow-hidden bg-white">
                      <div
                        className="absolute top-0 left-0 h-1 bg-orange-400"
                        style={{ width: `${storyProgress}%`, transition: "width 0.1s linear" }}
                      />
                      <img src={getImageUrl(selectedStory.image)} alt={story.title} className="w-full h-auto" />
                      <button
                        className="absolute top-2 right-2 bg-orange-400 text-white p-1 rounded-full hover:bg-orange-500 transition"
                        onClick={() => setSelectedStory(null)}
                      >
                        ✕
                      </button>
                      <button
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                        onClick={handlePrevStory}
                      >
                        ❮
                      </button>
                      <button
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
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
                <h2 className="text-3xl font-bold text-gray-800 text-center">Выберите филиал</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {branches.map((branch) => (
                    <button
                      key={branch.id}
                      onClick={() => setSelectedBranch(branch.id)}
                      className="py-3 px-6 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-orange-50 hover:border-orange-400 transition"
                    >
                      {branch.name}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Products */}
            {selectedBranch && (
              <section className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-bold text-gray-800">
                    {branches.find((b) => b.id === selectedBranch)?.name}
                  </h2>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setShowCart(true)}
                      className="relative text-gray-600 hover:text-orange-500 transition"
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
                    <button
                      onClick={handleBackToBranches}
                      className="text-gray-600 hover:text-orange-500 transition flex items-center"
                    >
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                      </svg>
                      Назад
                    </button>
                  </div>
                </div>

                <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => scrollToCategory(category.id)}
                      className={`py-2 px-4 rounded-full text-sm font-medium transition ${
                        activeCategory === category.id
                          ? "bg-orange-400 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>

                <div className="space-y-8">
                  {categories.map((category) => {
                    const categoryProducts = filteredProducts.filter((p) => p.category_id === category.id);
                    if (!categoryProducts.length) return null;
                    return (
                      <div key={category.id} ref={(el) => (categoriesRef.current[category.id] = el)}>
                        <h3 className="text-2xl font-semibold text-gray-800 mb-4">{category.name}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {categoryProducts.map((product) => (
                            <div
                              key={product.id}
                              className="bg-white rounded-lg shadow-sm hover:shadow-md transition cursor-pointer border border-gray-100 hover:border-orange-300"
                              onClick={() => setSelectedProduct(product)}
                            >
                              <img
                                src={getImageUrl(product.image)}
                                alt={product.name}
                                className="w-full h-48 object-cover rounded-t-lg"
                              />
                              <div className="p-4">
                                <h4 className="text-lg font-semibold text-gray-800">{product.name}</h4>
                                <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                                <p className="mt-2 text-orange-500 font-medium">
                                  {formatPrice(getDiscountedPrice(product.price_single, product.id))} Сом
                                  {discounts.some((d) => d.product_id === product.id) && (
                                    <span className="line-through text-gray-400 ml-2">
                                      {formatPrice(product.price_single)}
                                    </span>
                                  )}
                                </p>
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
                className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                onClick={() => setSelectedProduct(null)}
              >
                <div
                  className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <img
                    src={getImageUrl(selectedProduct.image)}
                    alt={selectedProduct.name}
                    className="w-full h-56 object-cover rounded-lg"
                  />
                  <h3 className="text-xl font-semibold text-gray-800">{selectedProduct.name}</h3>
                  <p className="text-gray-600 text-sm">{selectedProduct.description || "Нет описания"}</p>
                  {selectedProduct.price_small || selectedProduct.price_medium || selectedProduct.price_large ? (
                    <div className="space-y-2">
                      {["small", "medium", "large"].map(
                        (size) =>
                          selectedProduct[`price_${size}`] && (
                            <button
                              key={size}
                              onClick={() => addToCart(selectedProduct, size)}
                              className="w-full py-2 bg-orange-400 text-white rounded-lg hover:bg-orange-500 transition flex justify-between items-center px-4"
                            >
                              <span>
                                {size === "small" ? "Маленькая" : size === "medium" ? "Средняя" : "Большая"}
                              </span>
                              <span>{formatPrice(getDiscountedPrice(selectedProduct[`price_${size}`], selectedProduct.id))} Сом</span>
                            </button>
                          )
                      )}
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <p className="text-orange-500 font-medium">
                        {formatPrice(getDiscountedPrice(selectedProduct.price_single, selectedProduct.id))} Сом
                      </p>
                      <button
                        onClick={() => addToCart(selectedProduct)}
                        className="py-2 px-4 bg-orange-400 text-white rounded-lg hover:bg-orange-500 transition"
                      >
                        В корзину
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cart Sidebar */}
            {showCart && (
              <div
                className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-xl z-50 transform transition-transform duration-300"
                style={{ transform: showCart ? "translateX(0)" : "translateX(100%)" }}
              >
                <div className="p-6 h-full flex flex-col">
                  {!showCheckout ? (
                    <>
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold text-gray-800">Корзина</h2>
                        <button onClick={() => setShowCart(false)} className="text-gray-600 hover:text-gray-800">
                          ✕
                        </button>
                      </div>
                      <div className="flex-grow overflow-y-auto space-y-4">
                        {cart.map((item, index) => (
                          <div key={index} className="flex items-center space-x-4 border-b pb-4">
                            <img
                              src={getImageUrl(item.image)}
                              alt={item.name}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                            <div className="flex-grow">
                              <h4 className="text-sm font-medium text-gray-800">{item.name}</h4>
                              {item.size && (
                                <p className="text-xs text-gray-500">
                                  {item.size === "small" ? "Маленькая" : item.size === "medium" ? "Средняя" : "Большая"}
                                </p>
                              )}
                              <div className="flex items-center mt-1">
                                <button
                                  onClick={() => updateQuantity(index, item.quantity - 1)}
                                  className="w-6 h-6 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200"
                                >
                                  -
                                </button>
                                <span className="mx-2 text-sm">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(index, item.quantity + 1)}
                                  className="w-6 h-6 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-orange-500 font-medium">
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
                        ))}
                      </div>
                      <div className="mt-6 space-y-4">
                        <p className="text-lg font-semibold text-gray-800">
                          Итого: {formatPrice(calculateSubtotal())} Сом
                        </p>
                        <button
                          onClick={handleCheckout}
                          className="w-full py-3 bg-orange-400 text-white rounded-lg hover:bg-orange-500 transition"
                          disabled={!cart.length}
                        >
                          Оформить заказ
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-center mb-6">
                        <button onClick={() => setShowCheckout(false)} className="text-gray-600 hover:text-gray-800">
                          ← Назад
                        </button>
                        <h2 className="text-2xl font-semibold text-gray-800">Оформление</h2>
                        <button onClick={() => setShowCart(false)} className="text-gray-600 hover:text-gray-800">
                          ✕
                        </button>
                      </div>
                      <div className="flex-grow overflow-y-auto space-y-6">
                        <div>
                          <h3 className="text-lg font-medium text-gray-800 mb-2">Способ получения</h3>
                          <div className="space-y-2">
                            <div
                              className={`p-3 border rounded-lg cursor-pointer ${
                                deliveryOption === "pickup" ? "border-orange-400 bg-orange-50" : "border-gray-200"
                              }`}
                              onClick={() => {
                                setDeliveryOption("pickup");
                                setDeliveryCost(0);
                              }}
                            >
                              <h4 className="font-medium">Самовывоз</h4>
                              <p className="text-sm text-gray-600">Заберите в ресторане</p>
                            </div>
                            <div
                              className={`p-3 border rounded-lg cursor-pointer ${
                                deliveryOption === "delivery" ? "border-orange-400 bg-orange-50" : "border-gray-200"
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
                          <h3 className="text-lg font-medium text-gray-800 mb-2">Контакты</h3>
                          <div className="space-y-3">
                            <input
                              type="text"
                              placeholder="Имя"
                              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-orange-400 focus:border-orange-400"
                            />
                            <input
                              type="tel"
                              placeholder="Телефон"
                              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-orange-400 focus:border-orange-400"
                            />
                            {deliveryOption === "delivery" && (
                              <input
                                type="text"
                                placeholder="Адрес"
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-orange-400 focus:border-orange-400"
                              />
                            )}
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-800 mb-2">Промокод</h3>
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              value={promoCode}
                              onChange={(e) => setPromoCode(e.target.value.toUpperCase().trim())}
                              placeholder="Введите промокод"
                              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-orange-400 focus:border-orange-400"
                            />
                            <button
                              onClick={applyPromoCode}
                              className="py-2 px-4 bg-orange-400 text-white rounded-lg hover:bg-orange-500 transition"
                            >
                              Применить
                            </button>
                          </div>
                          {promoError && <p className="text-red-500 text-sm mt-1">{promoError}</p>}
                          {promoDiscount > 0 && (
                            <p className="text-green-500 text-sm mt-1">Скидка: {promoDiscount}%</p>
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-800 mb-2">Заказ</h3>
                          {cart.map((item) => (
                            <div key={item.id} className="flex justify-between py-2 border-b">
                              <span className="text-sm text-gray-800">
                                {item.name} {item.size && `(${item.size})`} x{item.quantity}
                              </span>
                              <span className="text-sm text-orange-500">
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
                            <div className="flex justify-between font-semibold">
                              <span>Итого:</span>
                              <span className="text-orange-500">
                                {formatPrice(
                                  calculateTotal() - (promoDiscount > 0 ? calculateSubtotal() * (promoDiscount / 100) : 0)
                                )}{" "}
                                Сом
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={handlePlaceOrder}
                        className="w-full py-3 mt-6 bg-orange-400 text-white rounded-lg hover:bg-orange-500 transition"
                      >
                        Подтвердить
                      </button>
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