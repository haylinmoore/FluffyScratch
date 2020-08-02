function Comment(props) {
	return (
		<tr>
			<th>
				<img
					src={`https://fluffyscratch.hampton.pw/profilepicture/v1/${props.comment.username}`}
				></img>
			</th>
			<th>{props.comment.username}</th>
			<td>{props.comment.text}</td>
		</tr>
	);
}

export default function commentthreadviewer({ Comments }) {
	return (
		<div>
			<link
				rel="stylesheet"
				href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css"
				integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm"
				crossOrigin="anonymous"
			/>
			<div className="container">
				<br />
				<h3>
					Comment thread ID {Comments[0].parentID} on{" "}
					{Comments[0].profile}'s Profile
				</h3>
				<table className="table">
					<tbody>
						{Comments.map((comment) => {
							return (
								<Comment
									comment={comment}
									key={comment.commentID}
								/>
							);
						})}
					</tbody>
				</table>

				<div>
					CommentThreadViewer and the FluffyScratch API that powers it
					was made with {`<3`} by{" "}
					<a href="https://hamptonmoore.com">Hampton Moore</a>
				</div>
			</div>
		</div>
	);
}

export async function getServerSideProps(context) {
	const response = await fetch(
		`https://fluffyscratch.hampton.pw/profilecomments/search/findBy/parentID/${context.params.parentID}`
	);
	const json = await response.json();

	return {
		props: { Comments: json }, // will be passed to the page component as props
	};
}
