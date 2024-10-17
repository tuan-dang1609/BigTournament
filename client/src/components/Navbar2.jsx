import { Link } from "react-router-dom";
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
// Helper function to render navigation items
const renderNavItem = (item) => {
    function classNames(...classes) {
        return classes.filter(Boolean).join(" ");
      }
  return (
    <Link
      key={item.name}
      to={item.href}
      aria-current={item.current ? "page" : undefined}
      className={
        item.logo
          ? "flex flex-row p-2 font-bold text-primary gap-x-2 border-2 rounded-2xl border-primary justify-center items-center"
          : classNames(
              item.current
                ? "text-primary flex flex-row gap-x-2 underline decoration-2 lg:underline-offset-[27px] underline-offset-4"
                : "hover:text-primary flex gap-x-2 flex-row",
              "rounded-md px-3 text-sm font-medium py-2"
            )
      }
    >
      {item.logo && (
        <img
          src={imageUrls[item.logo]}
          alt={`${item.name} Logo`}
          className="inline-block h-8 w-8"
        />
      )}
      <p className="py-1 text-a ">{item.name}</p>
    </Link>
  );
};

const MyNavbar2 = ({ navigation, isMenuOpen, setIsMenuOpen }) => {
  return (
    <nav className="bg-base-200 py-1 fixed w-full z-10 my-[72px]">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 flex h-16 items-center justify-center relative">
        {/* Hamburger Menu Button for mobile */}
        <div className="absolute inset-y-0 left-0 flex items-center min-[1024px]:hidden">
          <button
            className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span className="sr-only">Open main menu</span>
            {isMenuOpen ? (
              <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
            ) : (
              <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Desktop Menu */}
        <div className="hidden sm:ml-6 min-[1024px]:flex">
          <div className="flex space-x-4">
            {navigation.map(renderNavItem)}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="min-[1024px]:hidden px-2 pt-2 pb-3">
          {navigation.map(renderNavItem)}
        </div>
      )}
    </nav>
  );
};

export default MyNavbar2;
