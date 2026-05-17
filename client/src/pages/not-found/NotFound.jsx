import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div style={styles.container}>
            <h1 style={styles.title}>404</h1>
            <h2 style={styles.subtitle}>Page Not Found</h2>
            <p style={styles.text}>
                The page you are looking for doesn't exist or has been moved.
            </p>
            <Link to="/" style={styles.link}>Go Back Home</Link>
        </div>
    );
};

const styles = {
    container: {
        textAlign: 'center',
        marginTop: '10%',
        color: '#333',
    },
    title: {
        fontSize: '6rem',
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: '2rem',
    },
    text: {
        fontSize: '1.2rem',
        margin: '1rem 0',
    },
    link: {
        fontSize: '1.2rem',
        color: '#007bff',
        textDecoration: 'none',
        fontWeight: 'bold',
    },
};

export default NotFound;
