import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "./Popup"; // Assuming Popup is for displaying offer images
import { auth } from "../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";

export function Photoupload() {
  const [img, setImage] = useState(null);
  const [responseImg, setResponseImage] = useState(null);
  const [offer, setOffer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDonationSection, setShowDonationSection] = useState(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscrb = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
        navigate("/Login");
      }
    });
    return () => unsubscrb();
  }, [navigate]);

  function handleFile(event) {
    const selectedImg = event.target.files[0];
    if (selectedImg) {
      setImage(selectedImg);
    }
  }

  async function fetchRandomOffer() {
    try {
      const response = await fetch("https://wyldlyf-orginal-bknd.onrender.com/rndm-offers");
      if (response.ok) {
        const result = await response.json();
        setOffer(result);
        setShowDonationSection(true); // Show donation section
        storeOffer(result); // Automatically store the offer
      } else {
        console.error("Failed to fetch offers");
      }
    } catch (error) {
      console.error("Error fetching offer", error);
    }
  }

  async function submitFile(event) {
    event.preventDefault();
    if (img) {
      const formData = new FormData();
      setLoading(true);
      formData.append("file", img);

      try {
        const response = await fetch("https://wyldlyf-orginal-bknd.onrender.com/upload", {
          method: "POST",
          body: formData,
        });
        if (response.ok) {
          const result = await response.json();
          const trimmedResp = result.response.trim().toUpperCase();
          if (trimmedResp.includes("YES")) {
            setResponseImage("/Check_mark_animation.gif");
            fetchRandomOffer();
            setTimeout(() => setIsModalOpen(true), 5000);
          } else {
            setResponseImage("/wrong.gif");
          }
        } else {
          console.error("File Upload Failed");
        }
      } catch (error) {
        console.error("Error uploading file:", error);
      } finally {
        setLoading(false);
      }
    }
  }

  function handleDonate() {
    alert("Thank you for donating to Wildlife Preservation!");
    setOffer(null);
    setShowDonationSection(false);
  }

  async function storeOffer(offer) {
    if (!user || !user.email || !offer) return;
    try {
      const response = await fetch("https://wyldlyf-orginal-bknd.onrender.com/store-offer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          offerId: offer._id,
        }),
      });
      if (!response.ok) {
        console.error("Failed to store offer");
      }
    } catch (error) {
      console.error("Error storing offer:", error);
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl m-4">
      <div className="p-8">
        <h2 className="block text-lg font-medium text-gray-700 mb-4">Upload Photo</h2>
        {!responseImg ? (
          <form onSubmit={submitFile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Choose photo</label>
              <input
                type="file"
                onChange={handleFile}
                className="mt-1 block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-violet-50 file:text-violet-700
                hover:file:bg-violet-100"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? "Analysing the Image" : "Upload Photo"}
            </button>
          </form>
        ) : (
          <div className="flex flex-col items-center">
            <img src={responseImg} alt="Response" className="max-w-full h-auto mb-4" />
            {responseImg.includes("wrong.gif") && (
              <p className="text-red-600 font-semibold">
                Kindly upload the planting image.
              </p>
            )}
            {showDonationSection && (
              <div className="bg-white p-4 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-2">WildLife Preservation</h2>
                <p>
                  Congratulations! Your result qualifies you to support wildlife preservation.
                  The offer from partnered brands can be donated to this cause.
                </p>
                <p className="mt-2 italic">
                  <strong>Note:</strong> All funds raised will be directed toward wildlife preservation efforts.
                </p>
                <div className="mt-4 flex justify-between">
                  <button
                    onClick={() => {
                      setShowDonationSection(false);
                      handleDonate();
                    }}
                    className="bg-blue-500 hover:bg-green-700 text-white py-2 px-4 rounded"
                  >
                    Donate
                  </button>
                  <button
                    onClick={() => setShowDonationSection(false)}
                    className="bg-green-500 hover:bg-green-700 text-white py-2 px-4 rounded"
                  >
                    Accept
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        <Modal isOpen={isModalOpen} toggleModal={() => setIsModalOpen(false)} showOfferImage={true} offer={offer} />
        {loading && (
          <div className="fixed inset-0 flex justify-center items-center bg-gray-700 bg-opacity-50 z-50">
            <img src="/loading2.gif" alt="Creating..." className="w-30 h-30" />
          </div>
        )}
      </div>
    </div>
  );
}
