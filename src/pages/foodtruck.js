import React from "react";
import { Link } from 'react-router-dom';


const TestPage = () => {

    const foodTruckSchedule = {
        Lundi: [

            {
                name: "Pause gourmande",
                image: "/pausegourmande.jpg",
                description: "Burgers, kebab, plat du jour, entre 10€ et 15€ hors dessert (4€)"
            },
            {
                name: "Good Food",
                image: "/goodfood.jpg",
                description: "Ravioles et pates, entre 9€ et 11€ hors dessert (3.5€)"
            }
        ],
        Mardi: [
            {
                name: "L'atelier",
                image: "https://th.bing.com/th/id/OIP._HWC0tbATdj-R_ADqdZ16wAAAA?rs=1&pid=ImgDetMain",
                description: "Plat du jour et autre (manque d'info)"
            },
            {
                name: "Aveyronais",
                image: "https://th.bing.com/th/id/OIP.2rZYVSVvEdLvqCYdaVLyFAHaEJ?rs=1&pid=ImgDetMain",
                description: "Aligot saucisse, entre 9€ et 13€ hors dessert (2.5€)"
            }
        ],
        Mercredi: [
            {
                name: "le Ti Pay 974",
                image: "https://th.bing.com/th/id/OIP.axAtHcQWPcPSvpTqF3hxrwHaDu?rs=1&pid=ImgDetMain",
                description: "Réunionais, entre 8€ et 14€ hors dessert (4€)"
            },
            {
                name: "Splendwich",
                image: "https://th.bing.com/th/id/OIP.DFaNjaTkgveNdyzR7hVxKQHaEK?w=290&h=180&c=7&r=0&o=5&dpr=1.3&pid=1.7",
                description: "Des sandwichs (manque d'info)"
            },
        ],
        Jeudi: [
            {
                name: "Come la vida",
                image: "/poutine.jpg",
                description: "Poutine et sandwichs, entre 9€ et 15€ hors dessert (3.5€)"
            },
            {
                name: "Le bistrot Gônes",
                image: "https://th.bing.com/th/id/OIP.Jjdcf755OAr6zeTRF-ZphAHaEz?rs=1&pid=ImgDetMain",
                description: "Bistro, burger (manque d'info)"
            }
        ], Vendredi: [
            {
                name: "Chez Did'île",
                image: "https://www.reunionnaisdumonde.com/IMG/jpg/img-20220805-wa0014.jpg",
                description: "Réunionais, entre 8€ et 14€ hors dessert (4€)"
            },
        ]
    };

    const jours = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];

    return (
        <div className="calendar">
            <div className="container2">
                <div className="item-left"><div className="button-container">
                    <Link to="/">
                        <button className='boutton'>Retour</button>
                    </Link>
                </div>
                </div>
                <div className="item-center">
                    <h1 className="titre2">📅 Calendrier des Food Trucks</h1>
                </div>
            </div>
            <table className="table">
                <thead>
                    <tr>
                        {jours.map((jour) => (
                            <th className="jours" key={jour}>{jour}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {[0, 1].map((index) => ( // Deux foodtrucks par jour
                        <tr key={index}>
                            {jours.map((jour) => {
                                const truck = foodTruckSchedule[jour][index];
                                return (
                                    <td className="case" key={`${jour}-${index}`}>
                                        {truck ? (
                                            <div className="truck">
                                                <img src={truck.image} alt={truck.name} className="truck-image" />
                                                <h3>{truck.name}</h3>
                                                <p>{truck.description}</p>
                                            </div>
                                        ) : (
                                            <em>Pas de food truck</em>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TestPage;

