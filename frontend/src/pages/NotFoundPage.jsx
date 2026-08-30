import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Footer from '../components/Footer';
import Navigation from '../components/Navigation';

export default function NotFoundPage() {
    return (
        <div className='app-container'>
            <Navigation isLoggedIn={true} />
            <Footer isLoggedIn={true} />
        </div>
    )
}