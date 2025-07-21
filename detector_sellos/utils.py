import cv2
import numpy as np
from skimage.metrics import structural_similarity as ssim

def preprocess_image(path, size=(512, 512)):
    img = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise FileNotFoundError(f"No se pudo leer la imagen en la ruta: {path}")
    img = cv2.resize(img, size)
    _, thresh = cv2.threshold(img, 128, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return thresh

def compare_images(img1, img2):
    sift = cv2.SIFT_create()

    kp1, des1 = sift.detectAndCompute(img1, None)
    kp2, des2 = sift.detectAndCompute(img2, None)

    if des1 is None or des2 is None:
        return 0.0

    # Matcher FLANN (más rápido y tolerante que BFMatcher)
    index_params = dict(algorithm=1, trees=5)  # FLANN para SIFT
    search_params = dict(checks=50)
    flann = cv2.FlannBasedMatcher(index_params, search_params)

    matches = flann.knnMatch(des1, des2, k=2)

    # Ratio test de Lowe
    good_matches = []
    for m, n in matches:
        if m.distance < 0.75 * n.distance:
            good_matches.append(m)

    # Si hay suficientes matches, intentamos calcular homografía
    if len(good_matches) >= 4:
        src_pts = np.float32([kp1[m.queryIdx].pt for m in good_matches]).reshape(-1, 1, 2)
        dst_pts = np.float32([kp2[m.trainIdx].pt for m in good_matches]).reshape(-1, 1, 2)

        M, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)
        if mask is not None:
            match_score = float(np.sum(mask)) / len(mask)  # porcentaje de inliers
        else:
            match_score = 0.0
    else:
        match_score = 0.0

    return match_score
