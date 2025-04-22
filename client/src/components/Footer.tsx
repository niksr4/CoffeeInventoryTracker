export default function Footer() {
  return (
    <footer className="bg-gray-100 border-t border-gray-200 py-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm text-gray-600">
            &copy; {new Date().getFullYear()} CoffeeTrak Inventory Management System
          </p>
          <div className="flex space-x-4 mt-2 md:mt-0">
            <a href="#" className="text-gray-600 hover:text-[#4F772D] text-sm">Help</a>
            <a href="#" className="text-gray-600 hover:text-[#4F772D] text-sm">Privacy Policy</a>
            <a href="#" className="text-gray-600 hover:text-[#4F772D] text-sm">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
