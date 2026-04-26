import React, { useState } from 'react'
import { Navbar, Nav, Form, FormControl, Button, Container } from "react-bootstrap";
import { Search } from "react-bootstrap-icons";
import './NavigationBar.css';

const ThePlace = [

  {
    maintitle: "Based on Geographical Features",
    data: {
      HillStations: [
        {
          id: 1,
          title: "Munnar",
          location: {
            lat: 10.0889,
            lng: 77.0595
          },
          category: "HillStations",
          images: [
            "https://www.keralatourism.org/_next/image/?url=http%3A%2F%2F127.0.0.1%2Fktadmin%2Fimg%2Fpages%2Ftablet%2Fmunnar-blooms-blue-1743492906_7c09c3cad2add1e5fa89.webp&w=1920&q=75",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Munnar_hill_station_.JPG/1200px-Munnar_hill_station_.JPG",
            "https://media.assettype.com/newindianexpress%2F2025-02-09%2Fycta1vze%2Fmunnar.JPG?w=480&auto=format%2Ccompress&fit=max"
          ]
          // images: [
          //   "https://www.shoutlo.com/uploads/articles/header-img-kerala-setting-a-fine-example-for-the-rest-of-the-states-in-india.jpg",
          //   "https://www.hindustantimes.com/ht-img/img/2023/03/24/550x309/Further-down--in-Kerala--God-s-Own-Country--held-i_1679599101590_1679646049345_1679646049345.jpg",
          //   "https://img.etimg.com/thumb/width-420,height-315,imgsize-572036,resizemode-75,msid-98752954/wealth/spend/where-to-holiday-in-kerala-how-much-it-will-cost-you/kerala.jpg",
          // ]
        },
        {
          id: 2,
          title: "Wayanad",
          location: "",
          category: "HillStations",
          images: [
            "https://www.wayanad.com/files/slides/2064569462.webp",
            "https://blog.thomascook.in/wp-content/uploads/2017/08/Untitled-design-12-5.jpg",
            "https://avadale.in/wp-content/uploads/2024/06/10-scaled.jpg.webp"
          ]
        },
        {
          id: 3,
          title: "Thekkady",
          location: "",
          category: "HillStations",
          images: ["https://www.keralatourism.org/responsible-tourism/uploads/large-desktop/thekkady1920x1080-20230603101925523333.webp",
            "https://www.kerala.com/userfiles/1544171705_thekkady.jpg",
            "https://www.keralatravels.com/userfiles/1475817533_Thekkady.jpg"
          ]
        },
        {
          id: 4,
          title: "Vagamon",
          location: "",
          category: "HillStations",
          images: [
            "https://www.dtpcidukki.com/uploads/picture_gallery/gallery_images/vagamon-20230317084704232617.webp",
            "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0c/19/6a/d4/vagamon.jpg?w=1400&h=1400&s=1",
            "https://img.onmanorama.com/content/dam/mm/en/travel/kerala/images/2023/8/24/vagamon234.jpg/photos/16x9/photo.jpg"
          ]
        },
        {
          id: 5,
          title: "Ponmudi",
          location: "",
          category: "HillStations",
          images: [
            "https://www.theraviz.com/wp-content/uploads/2024/04/Ponmudi-%E2%80%93-The-Golden-Peak-in-Kerala.jpg",
            "https://ktil.in/wp-content/uploads/2023/08/ponmudi.jpg",
            "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/11/75/e3/cd/ponmudi.jpg?w=1200&h=-1&s=1"
          ]
        }
      ],
      Beaches: [
        {
          id: 1,
          title: "Varkala Cliff",
          location: "Dist. Thiruvananthapuram",
          category: "Beaches",
          images: [
            "https://media.assettype.com/newindianexpress%2F2024-08-23%2F52t662dc%2FTourism%20dept.jpg?w=480&auto=format%2Ccompress&fit=max",
            "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1b/4b/26/cf/caption.jpg?w=1200&h=-1&s=1",
            "https://www.karthitravels.com/images/new/varkala/varkalabeach2.jpg"
          ]
        },
        {
          id: 2,
          title: "Kovalam",
          location: "",
          category: "Beaches",
          images: [
            "https://s7ap1.scene7.com/is/image/incredibleindia/kovalam-beach-thiruvananthapuram-kerala-2-attr-hero?qlt=82&ts=1727367607784",
            "https://upload.wikimedia.org/wikipedia/commons/0/0e/01KovalamBeach%26Kerala.jpg",
            "https://www.theraviz.com/wp-content/uploads/2024/04/What-Makes-The-Leela-Kovalam-a-Raviz-Hotel-the-Most-Iconic-Resort-in-the-World.jpg"
          ]
        },
        {
          id: 3,
          title: "Varkala",
          location: "",
          category: "Beaches",
          images: [
            "https://mediaim.expedia.com/destination/1/f0fe68eca8ce050afd37a4456f3ccc3e.jpg",
            "https://images.squarespace-cdn.com/content/v1/5b37b71f506fbe848e3351a3/1589854049987-668JPXE2V4HZ66VV2QK7/paragliding-in-varkala-beach-kerala.jpg",
            "https://clubmahindra.gumlet.io/blog/media/section_images/exploringv-01b8b02d089583b.jpg?w=376&dpr=2.6"
          ]
        },
        {
          id: 4,
          title: "Marari",
          location: "",
          category: "Beaches",
          images: [
            "data:image/jpeg;base64,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",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTjeNPpGRGKkq2ZVrcTXhZ8KvHJGYY2w7ULow&s",
            "https://www.tourindiawithdriver.com/UPLOAD/SLIDESHOW/324-kerala-Marari-Beach.jpg"
          ]
        },
        {
          id: 5,
          title: "Bekal",
          location: "",
          category: "Beaches",
          images: [
            "https://travelsetu.com/apps/uploads/new_destinations_photos/destination/2023/12/15/f326962249c7d9d160129489155667e5_1000x1000.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSxqXYiVHTr73hyM1sCETVqjukJSBvOopBalQ&s",
            "https://upload.wikimedia.org/wikipedia/commons/d/d1/Bakel_Fort_Beach_Kasaragod7.jpg"
          ]
        },
        {
          id: 6,
          title: "Cherai",
          location: "",
          category: "Beaches",
          images: [
            "https://kerala.com/destination-sites/wp-content/themes/5Star/images/dummy/cherai-Beach-01.jpg",
            "https://kerala.com/destination-sites/wp-content/themes/5Star/images/dummy/cherai-Beach-01.jpg",
            "https://www.keralatourism.org/_next/image/?url=http%3A%2F%2F127.0.0.1%2Fktadmin%2Fimg%2Fpages%2Ftablet%2Fcherai-beach-1728570752_384a8191992d3fc60b77.webp&w=1920&q=75"
          ]
        }
      ],
      BackwatersAndLakes: [
        {
          id: 1,
          title: "Alleppey",
          location: "",
          category: "BackwatersAndLakes",
          images: [
            "https://static.toiimg.com/photo/109432028.cms",
            "https://lh5.googleusercontent.com/proxy/cKoReor5hb0c3oBBjR30dU1N3j9bttmWjajqruOrmZfUZCm6qVHxfNEYeU_v0USBMYrR6tQEG3jPiqDv24Zm_ikJiVJmW6d28atoX4pwk7p33Tog2s3szvMQu--Z",
            "https://media.assettype.com/newindianexpress%2F2025-03-31%2F8l0giv0x%2Ftourism111151.jpg?w=480&auto=format%2Ccompress&fit=max"
          ]
        },
        {
          id: 2,
          title: "Kumarakom",
          location: "",
          category: "BackwatersAndLakes",
          images: [
            "https://waybird.imgix.net/lodge_images/images/000/080/648/original/kumarakom-lake-resort-10.jpg?w=1200&h=630",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTUBSymXJ9uPJQwl6w0d2aVuMkYjzb39czLng&s",
            "https://www.kumarakom.com/files/slides/985685981.webp"
          ]
        },
        {
          id: 3,
          title: "Ashtamudi Lake",
          location: "",
          category: "BackwatersAndLakes",
          images: [
            "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1c/19/7b/19/caption.jpg?w=900&h=500&s=1",
            "https://www.keralatourism.org/_next/image/?url=http%3A%2F%2F127.0.0.1%2Fktadmin%2Fimg%2Fpages%2Fmobile%2Fashtamudi-lake-1721309650_e64796a7742652d69201.webp&w=3840&q=75",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSkQnlw7ESCh3TBhUKz_L7_ZsWVW6n4D8TWUg&s"
          ]
        },
        {
          id: 4,
          title: "Vembanad Lake",
          location: "",
          category: "BackwatersAndLakes",
          images: [
            "https://www.indigocruise.com/images/tourist-place/18c.jpg",
            "https://farm4.staticflickr.com/3561/3349599780_8487ca92da_z.jpg?zz=1",
            "https://www.india.com/wp-content/uploads/2019/05/Vembanad-Lake-in-Kerala.-.jpg"
          ]
        }
      ],
      Waterfalls: [
        {
          id: 1,
          title: "Athirapally",
          location: "",
          category: "Waterfalls",
          images: [
            "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0b/4b/a2/1c/athirapally-falls-in.jpg?w=1200&h=-1&s=1",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQTyia-y4-RS3h6Ow4NHke-hXqy5LVuFTD3kg&s",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsXG0hRcY-2E0RtMqlwlVy7aPTsQzaOIwlwA&s"
          ]
        },
        {
          id: 2,
          title: "Meenmutty",
          location: "",
          category: "Waterfalls",
          images: [
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTPClOTBnShTB65hy3DlnCXqGfxUu1NWAcuvQ&s",
            "https://www.keralatourism.org/_next/image/?url=http%3A%2F%2F127.0.0.1%2Fktadmin%2Fimg%2Fpages%2Fmobile%2Fmeenmutty-waterfalls-1729930794_06501f2bae3e3b11d3ed.webp&w=3840&q=75",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhsysdDabR-iVovZAgLUNkcUNBw_Hydt1_gw&s"
          ]
        },
        {
          id: 3,
          title: "Soochipara",
          location: "",
          category: "Waterfalls",
          images: [
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSE-eXdu0c2HRjp6ttLbHaBUbSyPyPUV7B4Kw&s",
            "https://bestinkeralam.com/wp-content/uploads/2024/01/Soochipara-Falls-Trek-2.jpg",
            "https://www.hlimg.com/images/things2do/738X538/ttd_1510903351m2.jpg"
          ]
        },
        {
          id: 4,
          title: "Thusharagiri",
          location: "",
          category: "Waterfalls",
          images: [
            "https://www.dtpckozhikode.com/uploads/picture_gallery/gallery_images/thusharagiri-20230509171758910026.webp",
            "https://www.dtpckozhikode.com/uploads/picture_gallery/gallery_images/thusharagiri-20230509171758910026.webp",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTq4FCAPZi4vzSfexcJKtq064iaskDJ4gvpOw&s"
          ]
        },
        {
          id: 5,
          title: "Palaruvi",
          location: "",
          category: "Waterfalls",
          images: [
            "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0f/83/f1/0a/dscn1202-largejpg.jpg?w=1200&h=-1&s=1",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0-hOl3aBOMhz_6sIq5821lmUq3axr6SyTmg&s",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0-hOl3aBOMhz_6sIq5821lmUq3axr6SyTmg&s"
          ]
        }
      ],
      WildlifeAndNationalParks: [
        {
          id: 1,
          title: "Periyar Wildlife Sanctuary",
          location: "",
          category: "WildlifeAndNationalParks",
          images: [
            "https://www.periyarnationalparkonline.in/images/periyar-wildlife-nature.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHhaGx6Cd1CPsc91_i9FeWgAv0h_hThXqHxA&s",
            "https://bespokeindiatravel.co.uk/wp-content/uploads/2018/01/PEriyyar.jpg"
          ]
        },
        {
          id: 2,
          title: "Parambikulam",
          location: "",
          category: "WildlifeAndNationalParks",
          images: [
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT0huukJFo3oMOzYPvj4JuYwSSFMat73i9ZxQ&s",
            "https://api.parambikulam.org/wp/1725173360756.jpg",
            "https://www.keralatourism.org/images/eco-tourism/destinations/Parambikkulam-tiger-reserve.jpg"
          ]
        },
        {
          id: 3,
          title: "Silent Valley",
          location: "",
          category: "WildlifeAndNationalParks",
          images: [
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSRwyPnvlWN_4KmtSbaFb1PujcPfiFqnbuxBA&s",
            "https://keralabee.com/wp-content/uploads/2024/01/IMG_20240101_184650-jpg.webp",
            "https://www.trawell.in/admin/images/upload/148645431SilentValleyPark_Main.jpg"
          ]
        },
        {
          id: 4,
          title: "Eravikulam",
          location: "",
          category: "WildlifeAndNationalParks",
          images: []
        }
      ]
    }
  },
  {
    maintitle: "Based on Cultural & Heritage Importance",
    data: {
      Temples: [
        {
          id: 1,
          title: "Sabarimala",
          location: "",
          category: "Temples",
          images: []
        },
        {
          id: 2,
          title: "Guruvayur",
          location: "",
          category: "Temples",
          images: []
        },
        {
          id: 3,
          title: "Padmanabhaswamy",
          location: "",
          category: "Temples",
          images: []
        },
        {
          id: 4,
          title: "Vadakkunnathan",
          location: "",
          category: "Temples",
          images: []
        }
      ],
      Churches: [
        {
          id: 1,
          title: "St. Francis Church (Kochi)",
          location: "",
          category: "Churches",
          images: []
        },
        {
          id: 2,
          title: "Malayattoor Church",
          location: "",
          category: "Churches",
          images: []
        },
        {
          id: 3,
          title: "Santa Cruz Basilica",
          location: "",
          category: "Churches",
          images: []
        }
      ],
      PalacesAndForts: [
        {
          id: 1,
          title: "Padmanabhapuram Palace",
          location: "",
          category: "PalacesAndForts",
          images: []
        },
        {
          id: 2,
          title: "Bekal Fort",
          location: "",
          category: "PalacesAndForts",
          images: []
        },
        {
          id: 3,
          title: "Dutch Palace",
          location: "",
          category: "PalacesAndForts",
          images: []
        },
        {
          id: 4,
          title: "Hill Palace",
          location: "",
          category: "PalacesAndForts",
          images: []
        }
      ],
      TraditionalArtsAndCultureCenters: [
        {
          id: 1,
          title: "Kathakali centers in Kochi",
          location: "",
          category: "TraditionalArtsAndCultureCenters",
          images: []
        },
        {
          id: 2,
          title: "Kerala Folklore Museum",
          location: "",
          category: "TraditionalArtsAndCultureCenters",
          images: []
        }
      ]
    }
  },
  {
    maintitle: "Based on Activities & Adventure",
    data: {
      TrekkingAndHiking: [
        {
          id: 1,
          title: "Agasthyakoodam",
          location: "",
          category: "TrekkingAndHiking",
          images: []
        },
        {
          id: 2,
          title: "Chembra Peak",
          location: "",
          category: "TrekkingAndHiking",
          images: []
        },
        {
          id: 3,
          title: "Meesapulimala",
          location: "",
          category: "TrekkingAndHiking",
          images: []
        }
      ],
      HouseboatRides: [
        {
          id: 1,
          title: "Alleppey",
          location: "",
          category: "HouseboatRides",
          images: []
        },
        {
          id: 2,
          title: "Kumarakom",
          location: "",
          category: "HouseboatRides",
          images: []
        }
      ],
      WildlifeSafari: [
        {
          id: 1,
          title: "Periyar",
          location: "",
          category: "WildlifeSafari",
          images: []
        },
        {
          id: 2,
          title: "Wayanad",
          location: "",
          category: "WildlifeSafari",
          images: []
        },
        {
          id: 3,
          title: "Chinnar Wildlife Sanctuary",
          location: "",
          category: "WildlifeSafari",
          images: []
        }
      ],
      WaterSports: [
        {
          id: 1,
          title: "Varkala",
          location: "",
          category: "WaterSports",
          images: []
        },
        {
          id: 2,
          title: "Kovalam",
          location: "",
          category: "WaterSports",
          images: []
        },
        {
          id: 3,
          title: "Beypore",
          location: "",
          category: "WaterSports",
          images: []
        }
      ]
    }
  },
  {
    maintitle: "Based on Unique Attractions",
    data: {
      TeaAndSpicePlantations: [
        {
          id: 1,
          title: "Munnar",
          location: "",
          category: "TeaAndSpicePlantations",
          images: []
        },
        {
          id: 2,
          title: "Thekkady",
          location: "",
          category: "TeaAndSpicePlantations",
          images: []
        },
        {
          id: 3,
          title: "Wayanad",
          location: "",
          category: "TeaAndSpicePlantations",
          images: []
        }
      ],
      AyurvedaAndWellnessRetreats: [
        {
          id: 1,
          title: "Kovalam",
          location: "",
          category: "AyurvedaAndWellnessRetreats",
          images: []
        },
        {
          id: 2,
          title: "Kumarakom",
          location: "",
          category: "AyurvedaAndWellnessRetreats",
          images: []
        },
        {
          id: 3,
          title: "Palakkad",
          location: "",
          category: "AyurvedaAndWellnessRetreats",
          images: []
        }
      ],
      VillageTourism: [
        {
          id: 1,
          title: "Kumbalangi",
          location: "",
          category: "VillageTourism",
          images: []
        },
        {
          id: 2,
          title: "Aranmula",
          location: "",
          category: "VillageTourism",
          images: []
        },
        {
          id: 3,
          title: "Kumarakom",
          location: "",
          category: "VillageTourism",
          images: []
        }
      ]
    }
  }

]

const UserNavBar = () => {
    const [hover, setHover] = useState(false);
  const [open, setOpen] = useState(false);


  const [isOpen, setIsOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <Navbar expand="lg" className="bg-white py-3 ">
      {/* <Navbar expand="lg" className="bg-white shadow-sm py-3 border-[2px] border-solid border-[#257212]"> */}
      <Container fluid>
        {/* Logo and Brand Name */}
        <Navbar.Brand href="#" className="d-flex align-items-center ">
          <img
            src="https://www.shutterstock.com/shutterstock/photos/1712936980/display_1500/stock-vector-kerala-state-india-initiative-logo-with-palm-coconut-tree-god-s-own-country-vector-illustration-1712936980.jpg"
            alt="Logo"
            className="rounded-circle me-2"
            style={{ width: "60px", height: "60px", objectFit: "cover", border: "5px solid rgb(229, 228, 226)" }}
          />
          <span className="title-name">Tourism</span>
        </Navbar.Brand>

        {/* Toggle Button for Mobile */}
      
        <div style={{ position: 'relative', width: '300px' }}>
  {/* Dropdown trigger */}
  <div
    className="d-flex align-items-center justify-content-between px-3 py-2 border rounded"
    style={{
      cursor: 'pointer',
      backgroundColor: '#fff',
      borderColor: '#ccc',
      fontWeight: 500,
    }}
    onClick={() => setIsOpen(!isOpen)}
    onMouseEnter={() => setIsOpen(!isOpen)}
    
  >
    <span>Select the place</span>
    { isOpen ? <span>▲</span> : <span>▼</span> }
    {/* <span className={`inline-block transform transition-transform duration-300 ${
    isOpen ? 'rotate-180' : 'rotate-0'}`}>
    ▼
    </span> */}

  </div>

  {/* Main Dropdown */}
  {isOpen && (
    <ul
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        width: '100%',
        background: '#fff',
        border: '1px solid #ccc',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        listStyle: 'none',
        padding: 0,
        margin: '4px 0 0',
        zIndex: 1000,
        borderRadius: '6px',
      }}
    >
      {ThePlace.map((place, index) => (
        <li
          key={index}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          style={{
            position: 'relative',
            padding: '10px 14px',
            borderBottom: '1px solid #eee',
            backgroundColor: hoveredIndex === index ? '#f8f9fa' : '#fff',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {place.maintitle}

          {/* Sub-options dropdown */}
          {hoveredIndex === index && (
            <ul
              style={{
                position: 'absolute',
                top: 0,
                left: '100%',
                background: '#fff',
                border: '1px solid #ccc',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                listStyle: 'none',
                padding: '8px',
                margin: 0,
                minWidth: '200px',
                zIndex: 1001,
                borderRadius: '6px',
              }}
            >
              {Object.entries(place.data).map(([key, value], subIndex) => (
                <li
                  key={subIndex}
                  style={{
                    padding: '6px 10px',
                    borderBottom: '1px solid #f1f1f1',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f1f1f1')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* <strong>{key}:</strong> {value.title} */}
                  {key}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  )}
</div>

  <Navbar.Toggle aria-controls="navbar-nav" />



        <Navbar.Collapse id="navbar-nav" className="">
          {/* Navbar Links */}
          <Nav className="ms-auto text-center text-lg-start">
            <Nav.Link
              href="#"
              className="text-dark active"
              style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 500, fontSize: '16px', lineHeight: '24px' }}
            >
              Home
            </Nav.Link>
            <Nav.Link
              href="#"
              className="text-dark"
              style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 500, fontSize: '16px', lineHeight: '24px' }}
            >
              Destinations
            </Nav.Link>
            <Nav.Link
              href="#"
              className="text-dark"
              style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 500, fontSize: '16px', lineHeight: '24px' }}
            >
              Activities
            </Nav.Link>

          </Nav>

          {/* Search Bar */}
          <Form className="d-flex mx-auto mt-3 mt-lg-0 position-relative" style={{ maxWidth: "400px" }}>
            <FormControl
              type="search"
              placeholder="Search your destinations..."
              className="rounded-pill px-4 shadow-sm"
              style={{ minWidth: "400px", width: "100%", maxWidth: "500px", height: "50px" }}
            />
            <Button
              variant="outline-secondary"
              className="position-absolute end-0 top-50 translate-middle-y border-0"
              style={{ backgroundColor: "transparent" }}
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
            >
              <Search style={{ color: hover ? "green" : "inherit", transition: "color 0.3s" }} />
            </Button>
          </Form>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default UserNavBar
