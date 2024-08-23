import {
    Disclosure, DisclosureButton, DisclosurePanel,
    Menu, MenuButton, MenuItem, MenuItems
} from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect} from 'react';
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from 'react-router-dom';
// Ensure this import is correct
import {
    signOut,
} from '../../redux/user/userSlice.js';
const images = import.meta.glob('../image/*.{png,jpg,jpeg,gif}');

function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
}

export default function Example() {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'autumn');
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const handleSignOut = async () => {
        try {
            await fetch('https://valosplit2-backend.vercel.app/api/auth/signout');
            dispatch(signOut());
            
            navigate("/");
        } catch (error) {
            console.log(error);
        }
    };
    // Make sure the Redux store is properly set up and Provider is wrapping the app
    const currentUser = useSelector(state => state.user?.currentUser);

    const [imageUrls, setImageUrls] = useState({});
    const location = useLocation();

    const navigation = [
        { name: 'Dashboard', href: '/', current: location.pathname === '/' },
        { name: 'Luật', href: '/valorant/me', current: location.pathname === '/valorant/me' },
    ];

    const handleToggle = (event) => setTheme(event.target.value);

    useEffect(() => {
        localStorage.setItem('theme', theme);
        document.querySelector('html').setAttribute('data-theme', theme);
    }, [theme]);

    useEffect(() => {
        const loadImageUrls = async () => {
            const urls = {};
            await Promise.all(Object.entries(images).map(async ([path, resolver]) => {
                try {
                    const module = await resolver();
                    urls[path.split('/').pop().split('.')[0]] = module.default;
                } catch (error) {
                    console.error(`Failed to load image at ${path}`, error);
                }
            }));
            setImageUrls(urls);
        };
        loadImageUrls();
    }, []);

    return (
        <Disclosure as="nav" className="bg-base-100 py-1 top-0 fixed w-full z-50">
            <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 flex h-16 items-center justify-between relative">
                <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                    <DisclosureButton className="group inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white">
                        <Bars3Icon className="block h-6 w-6 group-data-[open]:hidden" />
                        <XMarkIcon className="hidden h-6 w-6 group-data-[open]:block" />
                    </DisclosureButton>
                </div>
                <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                    <img alt="Your Company" src={imageUrls['waiting']} className="h-12.5 w-12.5" />
                    <div className="hidden sm:ml-6 sm:block">
                        <div className="flex space-x-4">
                            {navigation.map((item) => (
                                <Link key={item.name} to={item.href} aria-current={item.current ? 'page' : undefined}
                                    className={classNames(item.current ? 'text-primary underline underline-offset-8' : 'hover:text-accent hover:underline underline-offset-8', 'rounded-md px-3 text-sm font-medium')}>
                                    <p className='py-2.5 text-a '>{item.name}</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                    <div className="dropdown dropdown-end hidden [@supports(color:oklch(0%_0_0))]:block">
                        <div tabIndex={0} role="button" className="btn m-1 w-32 max-lg:w-auto rounded-2xl">
                            <span className="hidden lg:inline">
                                {[
                                    { value: 'autumn', label: '🌞 Light', logo: '🌞' },
                                    { value: 'forest', label: '🌙 Dark', logo: '🌙' },
                                    { value: 'valentine', label: '💘 Cute', logo: '💘' },
                                ].find(({ value }) => value === theme)?.label}
                            </span>
                            <span className="lg:hidden">
                                {[
                                    { value: 'autumn', label: 'Light', logo: '🌞' },
                                    { value: 'forest', label: 'Dark', logo: '🌙' },
                                    { value: 'valentine', label: 'Cute', logo: '💘' },
                                ].find(({ value }) => value === theme)?.logo}
                            </span>
                            <svg
                                width="12px"
                                height="12px"
                                className="inline-block h-2 w-2 fill-current opacity-60"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 2048 2048">
                                <path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path>
                            </svg>
                        </div>
                        <ul tabIndex={0} className="dropdown-content bg-base-300 rounded-box z-[1] w-52 p-2 shadow-2xl">
                            {[
                                { value: 'autumn', label: '🌞 Light', logo: '🌞' },
                                { value: 'forest', label: '🌙 Dark', logo: '🌙' },
                                { value: 'valentine', label: '💘 Cute', logo: '💘' },
                            ].map(({ value, label }) => (
                                <li key={value}>
                                    <input
                                        type="radio"
                                        name="theme-dropdown"
                                        className="theme-controller btn btn-sm btn-block btn-ghost justify-start"
                                        aria-label={label}
                                        value={value}
                                        onChange={handleToggle}
                                        checked={theme === value}
                                    />
                                </li>
                            ))}
                        </ul>
                    </div>

                    {currentUser ? (
                         <Menu as="div" className="relative ml-3">
                            <MenuButton className="relative flex rounded-full bg-gray-800 text-sm">
                                <img alt="" src={"https://drive.google.com/thumbnail?id="+currentUser.profilePicture} className="h-12.5 w-12.5 rounded-full" />
                         </MenuButton>
                            <MenuItems className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg">
                             <MenuItem>
                                    <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Thông tin của tôi</Link>
                             </MenuItem>
                             <MenuItem>
                                    <Link onClick={handleSignOut} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Đăng xuât</Link>
                             </MenuItem>
                         </MenuItems>
                     </Menu>
                    ) : (
                        <Link to="/signin" className='ml-3'><img alt="" src="https://drive.google.com/thumbnail?id=1dJXC3sq1fK3XKrRsTq3AfPUtalLrzds1" className="h-12.5 w-12.5 rounded-full" /></Link>
                    )}
                </div>
            </div>
            <DisclosurePanel className="sm:hidden">
                <div className="space-y-1 px-2 pb-3 pt-2">
                    {navigation.map((item) => (
                        <DisclosureButton key={item.name} as="a" href={item.href}
                            aria-current={item.current ? 'page' : undefined}
                            className={classNames(item.current ? 'btn btn-secondary flex white justify-start hover:text-white rounded-md px-3 py-2 text-base font-medium' : 'flex white justify-start bg-inherit my-2 px-3 py-2 text-base font-medium w-full')}>
                            {item.name}
                        </DisclosureButton>
                    ))}
                </div>
            </DisclosurePanel>

        </Disclosure>
    );
}
