import React, { useState } from 'react';

function gaben() {
    const [images, setImages] = useState([]);
    const [clickCount, setClickCount] = useState(0);



    const imageUrls = [
        "https://th.bing.com/th/id/R.f26f7273d8808e61a3899218d8b8bea2?rik=qLqZU9SsvS1TVg&riu=http%3a%2f%2fwww.spacecitynerd.com%2flaunch%2fwp-content%2fuploads%2f2014%2f06%2fgaben.png&ehk=9JQXmzAziJGRGbYC8pQs1rv1W4wPvBw%2fZfzsry3p60Q%3d&risl=&pid=ImgRaw&r=0",
        "https://th.bing.com/th/id/OIP.ujHuPtbCcjJNJB9dTbCFbwHaJl?rs=1&pid=ImgDetMain",
        "https://th.bing.com/th/id/R.3826af68f458bfe23366bdd8c6403920?rik=yFds0boF5FAXdw&riu=http%3a%2f%2fgetwallpapers.com%2fwallpaper%2ffull%2fc%2f1%2f4%2f181425.jpg&ehk=%2bIy%2bp147aSRX6JzJCadffUTSXo%2f2XpQKhtL29CYr8rA%3d&risl=&pid=ImgRaw&r=0",
    ];

    const handleClick = (e) => {
        const x = e.clientX;
        const y = e.clientY;
        const image = imageUrls[Math.floor(Math.random() * imageUrls.length)];
        const randomLeft = Math.random() * 100;
        const animationDuration = `${Math.random() * 3 + 3}s`;
        const newImage = {
            id: Date.now(),
            imageUrl: image,
            xPosition: x - 25,
            yPosition: y - 25,
            randomLeft,
            animationDuration,
        };

        setImages((prevImages) => [...prevImages, newImage]);
        setClickCount(clickCount + 1);
    };


    return (
        <div className="gabe" onClick={handleClick}>
            <div style={{ height: '5000px' }}> <p>Compteur de clics : {clickCount}</p></div>
            { }

            { }
            {images.map((image) => (
                <div
                    key={image.id}
                    className="image-falling"
                    style={{
                        backgroundImage: `url(${image.imageUrl})`,
                        left: `${image.randomLeft}%`,
                        top: `${image.yPosition}px`,
                        animation: `tomber ${image.animationDuration} linear forwards`,
                    }}
                    
                ></div>
            ))}
        </div>
    );
}


export default gaben;
