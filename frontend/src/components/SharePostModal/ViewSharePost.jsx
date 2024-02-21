import React, { useEffect, useState } from "react";
import { Link, useInRouterContext, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../../Contexts/authContext";
import CommentSection from "../Comments/CommentSection";
import ShareModal from "../SharePostModal/SharePostModal";
import TextsmsOutlinedIcon from "@mui/icons-material/TextsmsOutlined";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import FavoriteOutlinedIcon from "@mui/icons-material/FavoriteOutlined";
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import CloseIcon from '@mui/icons-material/Close';
import styles from "../Post/post.module.css";
import { parse } from "uuid";

const ViewSharePost = () => {
  const { postid } = useParams(); // Extracting user ID and post ID from the URL
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isLoggedIn, id, checkAuthentication } = useAuth();
  const [socket, setSocket] = useState(null);
  const [likes, setLikes] = useState(null);
  const [commentOpen, setCommentOpen] = useState(false);
  const [toggle, setToggle] = useState(false);
  const [showImg, setShowImg] = useState(false);
  const [username, setUsername] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [link, setLink] = useState(null);
  const [images, setImages] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [createdAt,setCreatedAt] = useState(null);
  const parsedID = parseInt(id);

  useEffect(() => {
    const fetchData = async () => {
      alert("Called");
      try {
        await checkAuthentication();
        const userRes = await fetch("https://zing-media.onrender.com/api/auth/" + id, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const userDetails = await userRes.json();
        console.log("User Details");
        console.log(userDetails);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    const fetchFriendRequests = async () => {
      try {
        const res = await fetch(
          "https://zing-media.onrender.com/api/friend_request/getFriends/" + parsedID
        );
        const data = await res.json();
      } catch (error) {
        console.error("Error fetching friend requests:", error);
      }
    };

    fetchData();

    // if (id && parsedID) {
    //   Promise.all([fetchData(),fetchFriendRequests()])
    //     .then(() => setIsLoading(false))
    //     .catch((error) => console.error('Error during data fetching:', error));
    // }
  }, [id, parsedID, checkAuthentication]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          `https://zing-media.onrender.com/api/posts/get_post_by_id/${postid}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        const postData = await res.json();
        setPost(postData);
        setLikes(post[0].likes);
        const images = Array.isArray(post[0].image)
          ? post[0].image
          : post[0].image && post[0].image !== "[]"
          ? JSON.parse(post[0].image)
          : [];
        setImages(images);
        setCreatedAt(post[0].createdAt)
        console.log("Hello Images");
        console.log(images);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching post data:", error);
      }
    };

    if (postid) {
      fetchData();
    }
  }, [post]);

  useEffect(() => {
    const newSocket = io("http://localhost:8000");
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    const socket = io("http://localhost:8000"); // Update the URL to match your server
    // Listen for 'updateLikes' event
    socket.on("updateLikes", ({ postId, updatedLikes }) => {
      if (postId === post[0].id) {
        setLikes(updatedLikes);
      }
    });
    // Clean up the socket connection on component unmount
    return () => {
      socket.disconnect();
    };
  }, [post]);

  // This function os for handling the like in the realtime for the posts
  const LikeHandler = async () => {
    // Assuming you have a post ID
    const userId = parseInt(id);
    const postId = post[0].id;
    try {
      const res = await fetch("https://zing-media.onrender.com/api/posts/like", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId: postId,
          userId: userId,
        }),
      });

      if (res.status === 200) {
      } else {
        console.error("Failed to update likes");
        // Handle error appropriately, e.g., show an error message to the user
      }
    } catch (error) {
      console.log(error);
      console.error("Error updating likes:", error);
    }
  };

  const handleShare = async () => {
    // Call backend API to generate a link for the post
    const response = await fetch(
      `https://zing-media.onrender.com/api/posts/share_post/${post[0].id}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      }
    );
    const data = await response.json();
    setLink(data);
    // Open the modal with the generated link
    setShowModal(true);
  };

  const showPostImg = (index) => {
    setSelectedImageIndex(index);
  };

  const closeFullImg = () => {
    setSelectedImageIndex(null);
  };

  const navigateImage = (direction) => {
    if (selectedImageIndex !== null) {
      const newIndex =
        direction === "next"
          ? (selectedImageIndex + 1) % images.length
          : (selectedImageIndex - 1 + images.length) % images.length;
      setSelectedImageIndex(newIndex);
    }
  };

  const getTimeDifferenceString = (timestamp) => {
    const currentDate = new Date();
    const timestampDate = new Date(timestamp);
    const timeDifferenceMilliseconds = currentDate - timestampDate;
    const timeDifferenceSeconds = Math.floor(timeDifferenceMilliseconds / 1000);
    const timeDifferenceMinutes = Math.floor(timeDifferenceSeconds / 60);
    const timeDifferenceHours = Math.floor(timeDifferenceMinutes / 60);
    const timeDifferenceDays = Math.floor(timeDifferenceHours / 24);

    if (timeDifferenceSeconds < 60) {
      return `${timeDifferenceSeconds} seconds ago`;
    } else if (timeDifferenceMinutes < 60) {
      return `${timeDifferenceMinutes} minutes ago`;
    } else if (timeDifferenceHours < 24) {
      return `${timeDifferenceHours} hours ago`;
    } else {
      return `${timeDifferenceDays} days ago`;
    }
  };

  const liked = false;

  // Your other useEffects and functions remain unchanged...

  return (
    <div>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        post && (
          
          <div className={styles.post}>
            <div className={styles.container}>
              <div className={styles.user}>
                <div className={styles.userInfo}>
                  <img src={post.profilePic} alt="" />
                  <div className={styles.details}>
                    <Link
                      to={`/profile/${post.userId}`}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <span className={styles.name}>{post[0].username}</span>
                    </Link>
                    <span className={styles.date}>{getTimeDifferenceString(createdAt)}</span>
                  </div>
                </div>
                {/* Rest of your user interface components */}
              </div>
              <div className={styles.content}>
                <p>{post[0].description}</p>
                {/* Render images */}
                <div className={styles.gallery}>
                  {images &&
                    images.map((image, index) => (
                      <div className={styles.imgContainer} key={index}>
                        <img
                          src={`https://zing-media.onrender.com/uploads/${image}`}
                          alt={`Image ${index}`}
                          onClick={() => showPostImg(index)}
                        />
                        {selectedImageIndex === index && (
                          <div className={styles.showFullImgContainer}>
                            <h2>Preview Post</h2>
                            <div className={styles.showFullImg}>
                              <img
                                src={`https://zing-media.onrender.com/uploads/${image}`}
                                alt={`Image ${index}`}
                                onClick={() => showPostImg(index)}
                              />
                              {/* Add the full-size image or any other content here */}
                              <button
                                onClick={() => navigateImage("prev")}
                                className={styles.prevImgBtn}
                              >
                                <KeyboardArrowLeftIcon />{" "}
                              </button>
                              <button
                                onClick={() => navigateImage("next")}
                                className={styles.nextImgBtn}
                              >
                                <KeyboardArrowRightIcon />
                              </button>
                              <button
                                onClick={closeFullImg}
                                className={styles.closeImgBtn}
                              >
                                <CloseIcon />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
              <div className={styles.info}>
                <div className={styles.item}>
                  {liked ? (
                    <FavoriteOutlinedIcon />
                  ) : (
                    <FavoriteBorderOutlinedIcon onClick={LikeHandler} />
                  )}
                  {likes}
                </div>
                <div
                  className={styles.item}
                  onClick={() => setCommentOpen(!commentOpen)}
                >
                  <TextsmsOutlinedIcon />
                  12 Comments
                </div>
                <div className={styles.item}>
                  <BookmarkBorderIcon />
                  Save
                </div>
                <div className={styles.item} onClick={handleShare}>
                  <ShareOutlinedIcon />
                  Share
                  {showModal && (
                    <ShareModal
                      link={link}
                      onClose={() => setShowModal(false)}
                    />
                  )}
                </div>
              </div>
              {commentOpen && (
                <CommentSection
                  postId={post[0].id}
                  userId={parsedID}
                  username={post[0].username}
                />
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default ViewSharePost;
