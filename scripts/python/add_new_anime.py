import requests
import json
from datetime import datetime
import os
import urllib.parse

def get_current_season():
    now = datetime.now()
    month = now.month
    if month in [1, 2, 3]:
        return "Winter"
    elif month in [4, 5, 6]:
        return "Spring"
    elif month in [7, 8, 9]:
        return "Summer"
    else:
        return "Fall"

def get_season_start_date():
    now = datetime.now()
    year = now.year
    if now.month in [1, 2, 3]:
        return datetime(year, 1, 1)
    elif now.month in [4, 5, 6]:
        return datetime(year, 4, 1)
    elif now.month in [7, 8, 9]:
        return datetime(year, 7, 1)
    else:
        return datetime(year, 10, 1)

def fetch_simulcast_anime():
    url = "https://kitsu.io/api/edge/anime"
    season_start = get_season_start_date()
    params = {
        "filter[status]": "current",
        "filter[seasonYear]": season_start.year,
        "filter[season]": get_current_season().lower(),
        "page[limit]": 20,
        "sort": "-userCount"
    }
    anime_list = []
    
    while url:
        response = requests.get(url, params=params)
        data = response.json()
        anime_list.extend(data['data'])
        url = data['links'].get('next')
        params = {}  # Clear params for pagination
    
    return anime_list

def format_date(date_string):
    if date_string:
        return datetime.fromisoformat(date_string.replace("Z", "+00:00")).strftime("%Y-%m-%d")
    return None

def download_image(url, folder):
    if not url:
        return None
    
    parsed_url = urllib.parse.urlparse(url)
    filename = os.path.basename(parsed_url.path)
    file_path = os.path.join(folder, filename)
    
    response = requests.get(url)
    if response.status_code == 200:
        with open(file_path, 'wb') as f:
            f.write(response.content)
        return file_path
    return None

def extract_anime_data(anime_data, images_folder):
    attributes = anime_data["attributes"]
    
    episode_count = attributes.get("episodeCount")
    if episode_count is None:
        episode_count = "None"
    
    formatted_data = {
        "id": anime_data["id"],
        "seriesID": anime_data["id"],
        "titleEnglish": attributes.get("titles", {}).get("en", ""),
        "titleRomaji": attributes.get("titles", {}).get("en_jp", ""),
        "dateStart": format_date(attributes.get("startDate")),
        "episodeCount": episode_count,
        "format": attributes.get("subtype", ""),
        "idKitsu": anime_data["id"],
        "idMAL": str(attributes.get("mappings", {}).get("myanimelist/anime", "")),
        "season": attributes.get("season", "").capitalize(),
        "keyVisuals": [],
        "coverImages": []
    }

    # Download and add poster images
    poster_sizes = ["tiny", "small", "medium", "large", "original"]
    poster_image = attributes.get("posterImage") or {}
    for size in poster_sizes:
        if poster_image.get(size):
            url = poster_image[size]
            local_path = download_image(url, images_folder)
            if local_path:
                formatted_data["keyVisuals"].append({
                    "height": poster_image.get("meta", {}).get("dimensions", {}).get(size, {}).get("height", 0),
                    "name": f"poster_{size}",
                    "url": url,
                    "width": poster_image.get("meta", {}).get("dimensions", {}).get(size, {}).get("width", 0),
                    "localPath": local_path
                })

    # Download and add cover images
    cover_sizes = ["tiny", "small", "large", "original"]
    cover_image = attributes.get("coverImage") or {}
    for size in cover_sizes:
        if cover_image.get(size):
            url = cover_image[size]
            local_path = download_image(url, images_folder)
            if local_path:
                formatted_data["coverImages"].append({
                    "height": cover_image.get("meta", {}).get("dimensions", {}).get(size, {}).get("height", 0),
                    "name": f"cover_{size}",
                    "url": url,
                    "width": cover_image.get("meta", {}).get("dimensions", {}).get(size, {}).get("width", 0),
                    "localPath": local_path
                })

    return formatted_data

def save_to_file(data, filename):
    folder_name = str(datetime.now().year)
    if not os.path.exists(folder_name):
        os.makedirs(folder_name)

    file_path = os.path.join(folder_name, filename)

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"Data saved to {file_path}")

def main():
    print("Fetching current simulcast season anime...")
    anime_list = fetch_simulcast_anime()
    
    folder_name = str(datetime.now().year)
    images_folder = os.path.join(folder_name, "images")
    if not os.path.exists(images_folder):
        os.makedirs(images_folder)
    
    formatted_anime_list = [extract_anime_data(anime, images_folder) for anime in anime_list]
    
    output = {
        "anime": formatted_anime_list,
        "id": f"simulcast_{get_current_season().lower()}_{datetime.now().year}",
        "start": formatted_anime_list[0] if formatted_anime_list else None
    }

    print(f"Found {len(formatted_anime_list)} anime in the current simulcast season.")
    
    filename = f"simulcast_{get_current_season().lower()}_{datetime.now().year}.json"
    save_to_file(output, filename)

if __name__ == "__main__":
    main()