import Link from "next/link";

const link_style = "rounded-md bg-white mx-6 my-2 py-2 px-4";

export const Nav = () => {
    return (
        <nav className="bg-blue-500 flex flex-col">
            <div className="p-1"></div>
            <Link href="/" className={link_style} >
                Dashboard
            </Link>
            <Link href="/detectors" className={link_style} >
                Configure Detectors
            </Link>
            <Link href="/sources" className={link_style} >
                Configure Image Sources
            </Link>
            <div className="m-auto"></div>
            <Link href="/api-key" className={link_style} >
                Set API Key
            </Link>
            <Link href="/download" className={link_style} >
                Download Configuration
            </Link>
            <div className="p-1"></div>
        </nav>
    );
}