import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import axios from "axios";
import { useAuth } from "../../Contexts/authContext";
import "./commentSection.css";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

const CommentSection = ({ postId, userId, userName }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [username, setUsername] = useState(null);
  const [socket, setSocket] = useState(null); //For setting the socket connection
  const { isLoggedIn, id, checkAuthentication } = useAuth();
  const parsedID = parseInt(id);

  useEffect(() => {
    const newSocket = io("http://localhost:8000");
    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };
  }, []);
  useEffect(() => {
    const fetchData = async () => {
      try {
        await checkAuthentication();
        const userRes = await fetch("https://zing-media.onrender.com/api/auth/" + id, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const userDetails = await userRes.json();
        setUsername(userDetails[0].username);
        // setUserPhoto(userDetails[0].profileImg);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    if (id && parsedID) {
      Promise.all([fetchData()])
        //.then(() => setIsLoading(false))
        .catch((error) => console.error("Error during data fetching:", error));
    }
  }, [id, parsedID, checkAuthentication]);

  // alert(username);

  useEffect(() => {
    async function fetchComments() {
      try {
        const res = await fetch(
          `https://zing-media.onrender.com/api/comment/get_comments/${postId}`
        );
        const data = await res.json();

        // Fetch profile image for each user who has commented
        const commentsWithProfileImages = await Promise.all(
          data.map(async (comment) => {
            const profileImageResponse = await fetchProfileImage(
              comment.userId
            );
            const profile = await profileImageResponse.json();
            comment.profileImg = profile[0].profileImg; // Assuming profileImg is the field containing the image URL
            return comment;
          })
        );

        console.log("commentsWithProfileImages")
        console.log(commentsWithProfileImages);

        setComments(commentsWithProfileImages);
      } catch (err) {
        console.error(err);
      }
    }
    fetchComments();
  }, [postId]);

  useEffect(() => {
    if (socket) {
      socket.on("comment", async ({ comment, postid, userid }) => {
          if (postid === postId) {
            const user = await fetchProfileImage(userid);
            const profile = await user.json();
            comment.profileImg = profile[0].profileImg; // Adding profile image to the comment object
            setComments((prevComments) => [...prevComments, comment]);
          }
      });

      socket.on("deleteComment", ({ comment, commentId }) => {
        setComments((prevComments) =>
          prevComments.filter((comment) => comment._id !== commentId)
        );
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [socket, postId]);

  const fetchProfileImage = async (userId) => {
    try {
      // Make a GET request to fetch the profile image URL from your backend API
      const response = await fetch(`https://zing-media.onrender.com/api/auth/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log("Responseeeeeeeeee");
      console.log(response);
      return response; // Return the response object
    } catch (error) {
      console.error("Error fetching profile image:", error);
      throw error; // Throw the error to be caught by the caller
    }
  };

  const handleComment = async () => {
    try {
      const response = await axios.post(
        "https://zing-media.onrender.com/api/comment/create_comments",
        {
          postId: postId,
          userId: userId,
          userName: username,
          text: newComment,
        }
      );
      // setComments((prevComments) => [...prevComments, response.data]);
      setNewComment("");
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await axios.delete(
        `https://zing-media.onrender.com/api/comment/delete_comments/${commentId}`
      );
      setComments((prevComments) =>
        prevComments.filter((comment) => comment._id !== commentId)
      );
    } catch (error) {
      console.error(error);
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

  return (
    <div className="commentContainer">
      <div className="addCommentTop">
        <h1>Add Comment</h1>

        <div className="addComment">
          <textarea
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="addCommentContainer"
          />
          <button onClick={handleComment} className="addCommentBtn">
            Comment
          </button>
        </div>
      </div>
      {/* <hr /> */}
      <div className="AllComments">
        <h1>All Comments</h1>
      </div>
      {/* {comments.map((comment) => (
        <div className="allCommentContainer">
          <div key={comment._id} className="comment">
            <div className="commentHeader">
              <div className="commentHeaderUserDiv">
                <div className="commentHeaderInfo">
                  <img
                    src="SocialMedia\frontend\src\assets\jd-chow-gutlccGLXKI-unsplash.jpg"
                    alt=""
                  />
                  <h1>{comment.userName}</h1>
                </div>
                <div className="commentHeaderTime">
                  <p>{getTimeDifferenceString(comment.createdAt)}</p>
                </div>
              </div>
              <div className="commentDelete">
                {comment.userId === userId && (
                  // <button onClick={() => handleDeleteComment(comment._id)}>
                  //   Delete
                  // </button>
                  <DeleteRoundedIcon
                    onClick={() => handleDeleteComment(comment._id)}
                    className="delBtn"
                  />
                )}
              </div>
            </div>
            <h2>{comment.text}</h2>
          </div>
        </div>
      ))} */}

      {comments.length > 0 ? (
        comments.map((comment) => (
          <div className="allCommentContainer" key={comment._id}>
            <div className="comment">
              <div className="commentHeader">
                <div className="commentHeaderUserDiv">
                  <div className="commentHeaderInfo">
                    <img
                      src={`https://zing-media.onrender.com/${comment.profileImg}`}
                      alt=""
                    />
                    <h1>{comment.userName}</h1>
                  </div>
                  <div className="commentHeaderTime">
                    <p>{getTimeDifferenceString(comment.createdAt)}</p>
                  </div>
                </div>
                <div className="commentDelete">
                  {comment.userId === userId && (
                    <DeleteRoundedIcon
                      onClick={() => handleDeleteComment(comment._id)}
                      className="delBtn"
                    />
                  )}
                </div>
              </div>
              <h2>{comment.text}</h2>
            </div>
          </div>
        ))
      ) : (
        <p
          style={{
            color: "rgb(179 177 184)",
            marginLeft: "15px",
            fontSize: "14px",
          }}
        >
          No Comments
        </p>
      )}
    </div>
  );
};

export default CommentSection;
