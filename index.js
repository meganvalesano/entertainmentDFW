const events = [
  {
    name: "Deep Ellum Live Music Night",
    city: "Dallas",
    category: "Music",
    date: "April 12",
    description: "A night of local bands, food trucks, and outdoor entertainment."
  },
  {
    name: "Fort Worth Food Festival",
    city: "Fort Worth",
    category: "Food",
    date: "April 18",
    description: "Taste dishes from top local chefs and food vendors."
  },
  {
    name: "Frisco Family Fun Day",
    city: "Frisco",
    category: "Family",
    date: "April 20",
    description: "Games, live shows, and kid-friendly activities for all ages."
  },
  {
    name: "Arlington Stadium Showdown",
    city: "Arlington",
    category: "Sports",
    date: "April 25",
    description: "Big rivalry game with tailgating and fan events."
  },
  {
    name: "Plano Arts in the Park",
    city: "Plano",
    category: "Arts",
    date: "May 2",
    description: "Outdoor art displays, performances, and handmade goods."
  }
];

const searchBtn = document.getElementById("filter-btn");
const againBtn = document.getElementById("again-btn");
const output = document.getElementById("ad-output");
const eventsContainer = document.getElementById("events-container");

function renderEvents(eventList) {
  eventsContainer.innerHTML = "";

  if (eventList.length === 0) {
    eventsContainer.innerHTML = `
      <p style="text-align:center; width:100%;">No matching events found.</p>
    `;
    output.style.display = "block";
    output.innerHTML = `
      <h4>No Results</h4>
      <p>Try a different keyword, city, or category.</p>
    `;
    return;
  }

  output.style.display = "block";
  output.innerHTML = `
    <h4>Events Found</h4>
    <p>${eventList.length} event(s) matched your search.</p>
  `;

  eventList.forEach((event, index) => {
    const card = document.createElement("div");
    card.className = "event-card";

    card.innerHTML = `
      <h3>${event.name}</h3>
      <p><strong>Date:</strong> ${event.date}</p>
      <p><strong>Location:</strong> ${event.city}</p>
      <p><strong>Category:</strong> ${event.category}</p>
      <p>${event.description}</p>
      <div class="rating">
        <div class="like" id="like-${index}">👍</div>
        <div class="dislike" id="dislike-${index}">👎</div>
      </div>
    `;

    const likeBtn = card.querySelector(`#like-${index}`);
    const dislikeBtn = card.querySelector(`#dislike-${index}`);

    likeBtn.addEventListener("click", () => {
      likeBtn.classList.add("active");
      dislikeBtn.classList.remove("active");
    });

    dislikeBtn.addEventListener("click", () => {
      dislikeBtn.classList.add("active");
      likeBtn.classList.remove("active");
    });

    eventsContainer.appendChild(card);
  });
}

searchBtn.addEventListener("click", () => {
  const searchValue = document.getElementById("search").value.toLowerCase().trim();
  const locationValue = document.getElementById("location").value;
  const categoryValue = document.getElementById("category").value;

  const filteredEvents = events.filter(event => {
    const matchesSearch =
      event.name.toLowerCase().includes(searchValue) ||
      event.description.toLowerCase().includes(searchValue);

    const matchesLocation =
      locationValue === "" || event.city === locationValue;

    const matchesCategory =
      categoryValue === "" || event.category === categoryValue;

    return matchesSearch && matchesLocation && matchesCategory;
  });

  renderEvents(filteredEvents);
});

if (againBtn) {
  againBtn.addEventListener("click", () => {
    document.getElementById("search").value = "";
    document.getElementById("location").value = "";
    document.getElementById("category").value = "";

    output.style.display = "none";
    renderEvents(events);
  });
}

// Show all events when page loads
renderEvents(events);
