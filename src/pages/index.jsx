import Layout from "./Layout.jsx";

import Chat from "./Chat";

import Projects from "./Projects";

import Prompts from "./Prompts";

import APIKeys from "./APIKeys";

import Usage from "./Usage";

import Settings from "./Settings";


import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Chat: Chat,
    
    Projects: Projects,
    
    Prompts: Prompts,
    
    APIKeys: APIKeys,
    
    Usage: Usage,
    
    Settings: Settings,
    
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Chat />} />
                
                
                <Route path="/Chat" element={<Chat />} />
                
                <Route path="/Projects" element={<Projects />} />
                
                <Route path="/Prompts" element={<Prompts />} />
                
                <Route path="/APIKeys" element={<APIKeys />} />
                
                <Route path="/Usage" element={<Usage />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                {/** Documentation route removed */}
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}