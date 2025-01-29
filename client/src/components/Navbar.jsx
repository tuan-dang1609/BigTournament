import {
  Disclosure,
  Menu,
  Transition,
  MenuItem,MenuItems,DisclosurePanel,MenuButton,DisclosureButton
} from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, Fragment } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { signOut } from "../../redux/user/userSlice.js";
const images = import.meta.glob("../image/*.{png,jpg,jpeg,gif}");

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Example() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "autumn");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await fetch("https://valosplit2-backend.vercel.app/api/auth/signout");
      dispatch(signOut());
      navigate("/arenaofvalor");
    } catch (error) {
      console.log(error);
    }
  };

  const currentUser = useSelector((state) => state.user?.currentUser);
  const [imageUrls, setImageUrls] = useState({});

  const navigationAll = {
    general: [
      { name: "Trang chủ", href: "/", current: location.pathname === "/" },
      { name: "Game", href: "/allgame", current: location.pathname === "/allgame" },
      { name: "Lịch trình", href: "/calendar", current: location.pathname === "/calendar" },
    ],
    valorant: [
      { name: "VALORANT", href: "/valorant", current: location.pathname === "/valorant", logo: "val_icon" },
      { name: "Nhánh đấu", href: "/valorant/qualifier", current: location.pathname === "/valorant/qualifier" },
      { name: "HOF", href: "/valorant/halloffame", current: location.pathname === "/valorant/halloffame" },
      { name: "Luật lệ", href: "/valorant/rule", current: location.pathname === "/valorant/rule" }
    ],
    aov: [
      { name: "Liên Quân Mobile", href: "/arenaofvalor", current: location.pathname === "/arenaofvalor", logo: "aov_icon" },
      { name: "Nhánh đấu", href: "/arenaofvalor/playoff", current: location.pathname === "/arenaofvalor/playoff"},
      { name: "BXH", href: "/arenaofvalor/ranking", current: location.pathname === "/arenaofvalor/ranking"},
      { 
        name: "Pick'em", 
        href: "/arenaofvalor/pickem/welcome", 
        current: ["/arenaofvalor/pickem/welcome", "/arenaofvalor/pickem", "/arenaofvalor/pickem/leaderboard","/arenaofvalor/pickem/pickemmatch"].includes(location.pathname)
      },
      { name: "HOF", href: "/arenaofvalor/halloffame", current: location.pathname === "/arenaofvalor/halloffame" },
      { name: "Luật lệ", href: "/arenaofvalor/luatle", current: location.pathname === "/arenaofvalor/luatle" },
    ]
,    
    tft: [
      { name: "Teamfight Tactics", href: "/tft", current: location.pathname === "/tft", logo: "tft_icon" },


    ],
    tft_double: [
      { name: "Teamfight Tactics Double", href: "/tftdouble/", current: location.pathname === "/tftdouble/", logo: "tft_icon" },
      { name: "BXH", href: "/tftdouble/ranking", current: location.pathname === "/tftdouble/ranking"},

    ],
    lol: [
      { name: "League Of Legends", href: "/leagueoflegend", current: location.pathname === "/leagueoflegend", logo: "lol_icon" },

    ],
    chess: [
      { name: "", href: "https://www.chess.com/", current: location.pathname === "https://www.chess.com/", logo: "lol_icon" },

    ],
  };

  const getNavigation = () => {
    if (location.pathname.includes("valorant")) return navigationAll.valorant;
    if (location.pathname.includes("arenaofvalor")) return navigationAll.aov;
    if (location.pathname.includes("/tft") && !location.pathname.includes("/tftdouble")) 
      return navigationAll.tft;
    if (location.pathname.includes("/tftdouble")) 
      return navigationAll.tft_double;
    if (location.pathname.includes("leagueoflegend")) return navigationAll.lol;
    if (location.pathname.includes("https://www.chess.com/")) return navigationAll.chess;
    return navigationAll.general;
  };

  const navigation = getNavigation();

  const handleToggle = (event) => setTheme(event.target.value);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.querySelector("html").setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const loadImageUrls = async () => {
      const urls = {};
      await Promise.all(
        Object.entries(images).map(async ([path, resolver]) => {
          try {
            const module = await resolver();
            urls[path.split("/").pop().split(".")[0]] = module.default;
          } catch (error) {
            console.error(`Failed to load image at ${path}`, error);
          }
        })
      );
      setImageUrls(urls);
    };
    loadImageUrls();
  }, []);

  return (
    <Disclosure as="nav" className="bg-base-100 py-1 fixed w-full z-50">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 flex h-16 items-center justify-between relative">
            <div className="absolute inset-y-0 left-0 flex items-center min-[1024px]:hidden">
              <DisclosureButton
                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <span className="sr-only">Open main menu</span>
                {open ? (
                  <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                )}
              </DisclosureButton>
            </div>
            <div className="flex flex-1 items-center justify-center min-[1024px]:items-stretch min-[1024px]:justify-start">
              <Link to="/">
                <img
                  alt="Your Company"
                  src={imageUrls["LogoChristmas"]}
                  className="h-12.5 w-12.5"
                />
              </Link>
              <div className="hidden sm:ml-6 min-[1024px]:block">
                <div className="flex space-x-4">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      aria-current={item.current ? "page" : undefined}
                      className={
                        item.logo
                          ? "flex flex-row p-2 font-bold text-primary gap-x-2 border-2 rounded-2xl border-primary justify-center items-center"  // Add your custom class here for items with logos
                          : classNames(
                            item.current
                              ? "text-primary flex flex-row gap-x-2 underline underline-offset-8"
                              : "hover:text-primary hover:underline underline-offset-8 flex gap-x-2 flex-row",
                            "rounded-md px-3 text-sm font-medium hover:underline underline-offset-8 py-2"
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
                      <p className="py-1 text-a">{item.name}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2">
              <div className="dropdown dropdown-end hidden sm:block">
                <label
                  tabIndex={0}
                  className="btn m-1 w-24 max-lg:w-auto rounded-2xl"
                >
                  {theme === "autumn" && "🌞 Light"}
                  {theme === "forest" && "🌙 Dark"}
                  {theme === "valentine" && "💘 Cute"}
                </label>
                <ul
                  tabIndex={0}
                  className="dropdown-content menu p-2 shadow bg-base-300 rounded-box w-44"
                >
                  <li>
                    <a onClick={() => handleToggle({ target: { value: "autumn" } })}>🌞 Light</a>
                  </li>
                  <li>
                    <a onClick={() => handleToggle({ target: { value: "forest" } })}>🌙 Dark</a>
                  </li>
                  <li>
                    <a onClick={() => handleToggle({ target: { value: "valentine" } })}>💘 Cute</a>
                  </li>
                </ul>
              </div>
              <div className="dropdown dropdown-end block sm:hidden">
                <label
                  tabIndex={0}
                  className="btn w-32 text-xl max-lg:w-auto rounded-2xl"
                >
                  {theme === "autumn" && "🌞"}
                  {theme === "forest" && "🌙"}
                  {theme === "valentine" && "💘"}
                </label>
                <ul
                  tabIndex={0}
                  className="dropdown-content menu p-2 shadow bg-base-300 rounded-box w-52"
                >
                  <li>
                    <a onClick={() => handleToggle({ target: { value: "autumn" } })}>🌞 Light</a>
                  </li>
                  <li>
                    <a onClick={() => handleToggle({ target: { value: "forest" } })}>🌙 Dark</a>
                  </li>
                  <li>
                    <a onClick={() => handleToggle({ target: { value: "valentine" } })}>💘 Cute</a>
                  </li>
                </ul>
              </div>


              {currentUser ? (
                <Menu as="div" className="relative ml-3">
                  <div>
                    <MenuButton className="flex text-sm rounded-full bg-gray-800">
                      <span className="sr-only">Open user menu</span>
                      <img
                        className="h-12.5 w-12.5 rounded-full"
                        src={`https://drive.google.com/thumbnail?id=${currentUser?.profilePicture}`}
                        alt=""
                      />
                    </MenuButton>
                  </div>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <MenuItems className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-base-300 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <MenuItem>
                        {({ active }) => (
                          <Link
                            to="/profile"
                            className={classNames(
                              active ? "bg-neutral " : "text-white",
                              "block px-4 py-2 text-sm w-full text-left"
                            )}
                          >
                            Cập nhật thông tin cá nhân
                          </Link>
                        )}
                      </MenuItem>
                      <MenuItem>
                        {({ active }) => (
                          <button
                            onClick={handleSignOut}
                            className={classNames(
                              active ? "bg-neutral " : "text-white",
                              "block px-4 py-2 text-sm w-full text-left"
                            )}
                          >
                            Đăng xuất
                          </button>
                        )}
                      </MenuItem>
                    </MenuItems>
                  </Transition>
                </Menu>
              ) : (
                <Link to="/signin" className="btn btn-primary ml-3">
                  Sign In
                </Link>
              )}
            </div>
          </div>
          <DisclosurePanel className="min-[1024px]:hidden">
            <div className="space-y-1 px-2 pt-2 pb-3">
              {navigation.map((item) => (
                <DisclosureButton
                  key={item.name}
                  as={Link}
                  to={item.href}
                  className={classNames(
                    item.current
                      ? "bg-primary text-white"
                      : "hover:bg-primary hover:text-white ",
                    "flex rounded-md px-3 py-2 text-base font-medium flex-row gap-x-2"
                  )}
                  aria-current={item.current ? "page" : undefined}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.logo && (
                        <img
                          src={imageUrls[item.logo]}
                          alt={`${item.name} Logo`}
                          className="inline-block h-8 w-8"
                        />
                      )}
                  <p className="py-1 text-a">{item.name}</p>
                </DisclosureButton>
              ))}
            </div>
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  );
}
