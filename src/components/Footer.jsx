const Footer = () => {
    return (
      <footer className="bg-gray-800 text-white p-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="font-bold">Booday Pizza</h3>
            <p>© 2025 Все права защищены</p>
          </div>
          <div>
            <h3 className="font-bold">Меню</h3>
            <a href="#branches" className="block hover:underline">Филиалы</a>
            <a href="#products" className="block hover:underline">Продукты</a>
          </div>
          <div>
            <h3 className="font-bold">Контакты</h3>
            <p>Email: info@boodaypizza.com</p>
            <p>Тел: +7 (999) 123-45-67</p>
          </div>
        </div>
      </footer>
    );
  };
  
  export default Footer;