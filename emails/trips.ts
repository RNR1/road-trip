function inviteSubject(sender: string) {
	return `${sender} invited you to join his trip!`;
}

function inviteBaseContent(sender: string, invitee?: { firstName: string }) {
	return `
  <h1>An invitation to join On The Road platform</h1>
  <p>
    Hello${invitee ? `, ${invitee.firstName}` : ''}! 
    this is an invitation from ${sender} to join his trip.
  </p>`;
}

export const inviteExistingUser = (
	sender: string,
	invitee?: { firstName: string }
) => {
	const baseContent = inviteBaseContent(sender, invitee);
	return {
		subject: inviteSubject(sender),
		content: `${baseContent}
      <p>
        To proceed, you can 
          <a 
            href="https://road-trip-client.vercel.app/trips/invitations">
              view your trip invitations
          </a> 
          in our platform.
      </p>`
	};
};

export function inviteNewUser(sender: string, key: string) {
	const baseContent = inviteBaseContent(sender);
	return {
		subject: inviteSubject(sender),
		content: `
				${baseContent}
				<p>
					To proceed, you can 
						<a href="https://road-trip-client.vercel.app/signup?key=${key}">
							create an account
						</a> 
					in our platform.
				</p>`
	};
}
